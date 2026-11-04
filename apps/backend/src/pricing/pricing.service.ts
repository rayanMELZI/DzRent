import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { BusinessRuleException } from '../common/exceptions/app.exceptions';
import { rentalDays } from '../common/utils/date.util';

export interface ResolvedRates {
  dailyRateDA: number;
  weeklyRateDA: number | null;
  monthlyRateDA: number | null;
  depositAmountDA: number;
  taxRatePct: number;
}

export interface QuoteOptions {
  additionalDrivers?: number;
  hasChildSeat?: boolean;
  hasGpsScreen?: boolean;
  withInsuranceWaiver?: boolean;
}

export interface Quote {
  dailyRateDA: number;
  totalDays: number;
  subtotalDA: number; // rental days (with weekly/monthly tiering)
  optionsDA: number;
  insuranceAmountDA: number;
  discountDA: number;
  taxRatePct: number;
  taxAmountDA: number;
  depositAmountDA: number;
  totalAmountDA: number; // grand total charged to client (excl. deposit)
}

/**
 * PricingService — resolves the effective rate for a vehicle and builds
 * the immutable price snapshot stored on each Booking.
 *
 * Resolution chain (schema rule):
 *   Vehicle per-field override → WilayaPricingRule(agency, wilaya, category) → 422.
 * Tax: rule.taxRatePct, else standard Algerian TVA 19%.
 * Tiering: monthly blocks first (≥30 days), then weekly (≥7), then daily —
 * each tier only applies if the agency defined that rate.
 */
@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  async resolveRates(
    vehicleId: string,
  ): Promise<ResolvedRates & { agencyId: string; wilayaId: number }> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId, deletedAt: null },
      select: {
        agencyId: true,
        dailyRateDA: true,
        weeklyRateDA: true,
        monthlyRateDA: true,
        depositAmountDA: true,
        category: { select: { slug: true } },
        agency: { select: { wilayaId: true } },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found.');

    const rule = await this.prisma.wilayaPricingRule.findUnique({
      where: {
        agencyId_wilayaId_categorySlug: {
          agencyId: vehicle.agencyId,
          wilayaId: vehicle.agency.wilayaId,
          categorySlug: vehicle.category.slug,
        },
      },
    });
    const activeRule = rule?.isActive ? rule : null;

    const daily = vehicle.dailyRateDA ?? activeRule?.dailyRateDA;
    if (daily == null) {
      throw new BusinessRuleException(
        'PRICING_NOT_CONFIGURED',
        'No daily rate is configured for this vehicle (neither vehicle override nor wilaya pricing rule).',
      );
    }

    const vehicleDeposit = Number(vehicle.depositAmountDA);
    return {
      agencyId: vehicle.agencyId,
      wilayaId: vehicle.agency.wilayaId,
      dailyRateDA: Number(daily),
      weeklyRateDA:
        vehicle.weeklyRateDA != null
          ? Number(vehicle.weeklyRateDA)
          : activeRule?.weeklyRateDA != null
            ? Number(activeRule.weeklyRateDA)
            : null,
      monthlyRateDA:
        vehicle.monthlyRateDA != null
          ? Number(vehicle.monthlyRateDA)
          : activeRule?.monthlyRateDA != null
            ? Number(activeRule.monthlyRateDA)
            : null,
      depositAmountDA:
        vehicleDeposit > 0 ? vehicleDeposit : activeRule ? Number(activeRule.depositAmountDA) : 0,
      taxRatePct: activeRule ? Number(activeRule.taxRatePct) : 19,
    };
  }

  async buildQuote(
    vehicleId: string,
    from: Date,
    until: Date,
    options: QuoteOptions = {},
  ): Promise<Quote> {
    if (until <= from) {
      throw new BusinessRuleException('INVALID_PERIOD', 'Return date must be after pickup date.');
    }
    const rates = await this.resolveRates(vehicleId);
    const totalDays = rentalDays(from, until);

    // ── Tiered rental subtotal ────────────────────────────────────────────
    let remaining = totalDays;
    let subtotal = 0;
    if (rates.monthlyRateDA && remaining >= 30) {
      const months = Math.floor(remaining / 30);
      subtotal += months * rates.monthlyRateDA;
      remaining -= months * 30;
    }
    if (rates.weeklyRateDA && remaining >= 7) {
      const weeks = Math.floor(remaining / 7);
      subtotal += weeks * rates.weeklyRateDA;
      remaining -= weeks * 7;
    }
    subtotal += remaining * rates.dailyRateDA;

    // ── Per-day options (amounts from PlatformConfig, DZD/day) ────────────
    const [driverFee, childSeatFee, gpsScreenFee, waiverFee] = await Promise.all([
      this.platformConfig.get<number>('option_additional_driver_per_day_da', 500),
      this.platformConfig.get<number>('option_child_seat_per_day_da', 300),
      this.platformConfig.get<number>('option_gps_screen_per_day_da', 200),
      this.platformConfig.get<number>('insurance_waiver_per_day_da', 800),
    ]);
    const optionsDA =
      (options.additionalDrivers ?? 0) * driverFee * totalDays +
      (options.hasChildSeat ? childSeatFee * totalDays : 0) +
      (options.hasGpsScreen ? gpsScreenFee * totalDays : 0);
    const insuranceAmountDA = options.withInsuranceWaiver ? waiverFee * totalDays : 0;

    const discountDA = 0; // Promo codes are post-MVP
    const taxable = subtotal + optionsDA + insuranceAmountDA - discountDA;
    const taxAmountDA = Math.round(taxable * rates.taxRatePct) / 100;
    const totalAmountDA = Math.round((taxable + taxAmountDA) * 100) / 100;

    return {
      dailyRateDA: rates.dailyRateDA,
      totalDays,
      subtotalDA: subtotal,
      optionsDA,
      insuranceAmountDA,
      discountDA,
      taxRatePct: rates.taxRatePct,
      taxAmountDA,
      depositAmountDA: rates.depositAmountDA,
      totalAmountDA,
    };
  }
}
