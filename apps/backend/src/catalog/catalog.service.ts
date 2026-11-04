import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { BusinessRuleException } from '../common/exceptions/app.exceptions';
import { bookableVehicleWhere } from '../vehicles/vehicles.service';
import { AgencyCarsQueryDto, QuoteDto, SearchAgenciesDto } from './dto/catalog.dto';

/** Upper bound on vehicles scanned per agency-first search (one wilaya, one period). */
const SEARCH_SCAN_LIMIT = 500;

/** Public, client-safe vehicle projection — no plate, VIN, GPS or internal notes. */
const PUBLIC_VEHICLE_SELECT = {
  id: true,
  agencyId: true,
  make: true,
  model: true,
  year: true,
  color: true,
  fuelType: true,
  transmission: true,
  seats: true,
  doors: true,
  trunkVolumeLiters: true,
  features: true,
  photos: true,
  category: { select: { slug: true, nameFr: true, nameAr: true } },
} satisfies Prisma.VehicleSelect;

type PublicVehicleRow = Prisma.VehicleGetPayload<{ select: typeof PUBLIC_VEHICLE_SELECT }>;

/** Public, client-safe agency projection — no RC/NIF numbers, owner or commission. */
const PUBLIC_AGENCY_SELECT = {
  id: true,
  name: true,
  nameAr: true,
  slug: true,
  description: true,
  descriptionAr: true,
  commune: true,
  address: true,
  phone: true,
  isVerified: true,
  verifiedAt: true,
  createdAt: true,
  wilaya: { select: { id: true, code: true, nameFr: true, nameAr: true } },
} satisfies Prisma.AgencySelect;

/**
 * Public catalogue for the client website — browsable without an account.
 *
 * Search is AGENCY-FIRST (design handoff §3.1): results are always agencies, a
 * model/category filter returns the agencies offering it, and cars are only ever
 * listed inside an agency. Bookability rules come from `bookableVehicleWhere`, the
 * same definition the authenticated search and booking flow rely on.
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  // ── Reference data ──────────────────────────────────────────────────────────
  wilayas() {
    return this.prisma.wilaya.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, code: true, nameFr: true, nameAr: true, regionCode: true },
    });
  }

  categories() {
    return this.prisma.vehicleCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, nameFr: true, nameAr: true, iconKey: true },
    });
  }

  // ── Agency-first search ─────────────────────────────────────────────────────
  async searchAgencies(q: SearchAgenciesDto) {
    const { from, until } = this.period(q.from, q.until);

    const vehicles = await this.prisma.vehicle.findMany({
      where: bookableVehicleWhere({
        wilayaId: q.wilayaId,
        from,
        until,
        categorySlug: q.categorySlug,
      }),
      take: SEARCH_SCAN_LIMIT,
      select: { id: true, agencyId: true, make: true, model: true },
    });

    // Drop vehicles with no configured rate (not bookable) and remember the rate.
    const priced = await this.withDailyRates(vehicles);

    // Distinct models across the wilaya/period — feeds the model filter. Computed
    // before the model filter so the filter list never collapses to one entry.
    const models = [...new Set(priced.map((v) => `${v.make} ${v.model}`))].sort((a, b) =>
      a.localeCompare(b, 'fr'),
    );

    const matching = q.model ? priced.filter((v) => `${v.make} ${v.model}` === q.model) : priced;

    const byAgency = new Map<string, { cars: number; minDailyRateDA: number }>();
    for (const v of matching) {
      const agg = byAgency.get(v.agencyId) ?? { cars: 0, minDailyRateDA: Infinity };
      agg.cars += 1;
      agg.minDailyRateDA = Math.min(agg.minDailyRateDA, v.dailyRateDA);
      byAgency.set(v.agencyId, agg);
    }

    const agencyIds = [...byAgency.keys()];
    const [agencies, stats] = await Promise.all([
      this.prisma.agency.findMany({
        where: { id: { in: agencyIds } },
        select: PUBLIC_AGENCY_SELECT,
      }),
      this.trustStats(agencyIds),
    ]);

    const items = agencies
      .map((a) => ({
        ...a,
        ...stats.get(a.id)!,
        availableCars: byAgency.get(a.id)!.cars,
        minDailyRateDA: byAgency.get(a.id)!.minDailyRateDA,
      }))
      // Verified first (all are, today — search only admits verified agencies),
      // then best rated, then most completed rentals.
      .sort(
        (a, b) =>
          Number(b.isVerified) - Number(a.isVerified) ||
          (b.rating ?? 0) - (a.rating ?? 0) ||
          b.completedRentals - a.completedRentals,
      );

    return { items, total: items.length, models };
  }

  // ── Agency page ─────────────────────────────────────────────────────────────
  async agency(id: string, q: AgencyCarsQueryDto) {
    const agency = await this.prisma.agency.findFirst({
      where: { id, isVerified: true, isActive: true, isSuspended: false, deletedAt: null },
      select: PUBLIC_AGENCY_SELECT,
    });
    if (!agency) throw new NotFoundException('Agency not found.');

    const period = q.from && q.until ? this.period(q.from, q.until) : undefined;
    const [vehicles, stats, reviews] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: bookableVehicleWhere({ agencyId: id, ...period }),
        orderBy: [{ category: { sortOrder: 'asc' } }, { createdAt: 'desc' }],
        select: PUBLIC_VEHICLE_SELECT,
      }),
      this.trustStats([id]),
      this.prisma.review.findMany({
        where: { agencyId: id, isApproved: true, isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          overallRating: true,
          comment: true,
          commentAr: true,
          agencyResponse: true,
          createdAt: true,
          client: { select: { firstName: true } },
        },
      }),
    ]);

    return {
      ...agency,
      ...stats.get(id)!,
      cars: await this.withPricing(vehicles),
      reviews: reviews.map(({ client, ...r }) => ({ ...r, author: client.firstName })),
    };
  }

  // ── Car detail ──────────────────────────────────────────────────────────────
  async vehicle(id: string) {
    const v = await this.prisma.vehicle.findFirst({
      where: bookableVehicleWhere({ vehicleId: id }),
      select: PUBLIC_VEHICLE_SELECT,
    });
    if (!v) throw new NotFoundException('Vehicle not found or not bookable.');

    const [[car], agency, stats] = await Promise.all([
      this.withPricing([v]),
      this.prisma.agency.findUniqueOrThrow({
        where: { id: v.agencyId },
        select: PUBLIC_AGENCY_SELECT,
      }),
      this.trustStats([v.agencyId]),
    ]);
    if (!car) throw new NotFoundException('Vehicle not found or not bookable.');
    return { ...car, agency: { ...agency, ...stats.get(v.agencyId)! } };
  }

  // ── Price quote (same engine the booking snapshot uses) ─────────────────────
  async quote(dto: QuoteDto) {
    const { from, until } = this.period(dto.from, dto.until);
    const bookable = await this.prisma.vehicle.count({
      where: bookableVehicleWhere({ vehicleId: dto.vehicleId, from, until }),
    });
    if (!bookable) {
      throw new BusinessRuleException(
        'VEHICLE_UNAVAILABLE',
        'This vehicle is not available for the selected period.',
      );
    }
    return this.pricing.buildQuote(dto.vehicleId, from, until, {
      additionalDrivers: dto.additionalDrivers,
      hasChildSeat: dto.hasChildSeat,
      hasGpsScreen: dto.hasGpsScreen,
      withInsuranceWaiver: dto.withInsuranceWaiver,
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  private period(fromIso: string, untilIso: string) {
    const from = new Date(fromIso);
    const until = new Date(untilIso);
    if (until <= from) {
      throw new BusinessRuleException('INVALID_PERIOD', 'Return must be after pickup.');
    }
    return { from, until };
  }

  /** Rating (approved, visible reviews), review count and completed rentals per agency. */
  private async trustStats(agencyIds: string[]) {
    const [ratings, completed] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['agencyId'],
        where: { agencyId: { in: agencyIds }, isApproved: true, isHidden: false },
        _avg: { overallRating: true },
        _count: { _all: true },
      }),
      this.prisma.booking.groupBy({
        by: ['agencyId'],
        where: { agencyId: { in: agencyIds }, status: BookingStatus.COMPLETED },
        _count: { _all: true },
      }),
    ]);
    const out = new Map<
      string,
      { rating: number | null; reviewCount: number; completedRentals: number }
    >();
    for (const id of agencyIds) {
      const r = ratings.find((x) => x.agencyId === id);
      const c = completed.find((x) => x.agencyId === id);
      out.set(id, {
        rating: r?._avg.overallRating != null ? Math.round(r._avg.overallRating * 10) / 10 : null,
        reviewCount: r?._count._all ?? 0,
        completedRentals: c?._count._all ?? 0,
      });
    }
    return out;
  }

  private async withDailyRates<T extends { id: string }>(vehicles: T[]) {
    const out: (T & { dailyRateDA: number })[] = [];
    for (const v of vehicles) {
      try {
        const r = await this.pricing.resolveRates(v.id);
        out.push({ ...v, dailyRateDA: r.dailyRateDA });
      } catch {
        /* PRICING_NOT_CONFIGURED → not bookable, hide */
      }
    }
    return out;
  }

  /** Attach resolved public pricing; photos become a count (keys stay private). */
  private async withPricing(vehicles: PublicVehicleRow[]) {
    const out = [];
    for (const { photos, ...v } of vehicles) {
      try {
        const r = await this.pricing.resolveRates(v.id);
        out.push({
          ...v,
          photoCount: photos.length,
          pricing: {
            dailyRateDA: r.dailyRateDA,
            weeklyRateDA: r.weeklyRateDA,
            monthlyRateDA: r.monthlyRateDA,
            depositAmountDA: r.depositAmountDA,
            taxRatePct: r.taxRatePct,
          },
        });
      } catch {
        /* PRICING_NOT_CONFIGURED → not bookable, hide */
      }
    }
    return out;
  }
}
