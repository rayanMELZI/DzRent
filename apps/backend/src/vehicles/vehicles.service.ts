import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, VehicleDocumentType, VehicleStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { PricingService } from '../pricing/pricing.service';
import { BusinessRuleException } from '../common/exceptions/app.exceptions';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { BLOCKING_BOOKING_STATUSES } from '../common/constants/booking.constants';
import {
  AddInsuranceDto,
  AddVehiclePhotoDto,
  CreateVehicleDto,
  SearchVehiclesDto,
  SetVehicleStatusDto,
  SubmitVehicleDocDto,
  UpdateVehicleDto,
  VehicleDocIntentDto,
  VehiclePhotoIntentDto,
} from './dto/vehicle.dto';

const PHOTO_MAX = 8 * 1024 * 1024;
const DOC_MAX = 10 * 1024 * 1024;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly pricing: PricingService,
  ) {}

  /** Loads a vehicle and enforces agency-scope access (owner / staff / ADMIN). */
  private async withAccess(vehicleId: string, caller: AuthenticatedUser) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId, deletedAt: null },
      include: {
        agency: { select: { id: true, ownerId: true, wilayaId: true } },
        category: { select: { slug: true } },
      },
    });
    if (!v) throw new NotFoundException('Vehicle not found.');
    const ok =
      caller.role === UserRole.ADMIN ||
      v.agency.ownerId === caller.id ||
      caller.agencyId === v.agencyId;
    if (!ok) throw new ForbiddenException('This vehicle belongs to another agency.');
    return v;
  }

  async create(caller: AuthenticatedUser, dto: CreateVehicleDto) {
    if (!caller.agencyId) throw new ForbiddenException('Create or join an agency first.');
    const category = await this.prisma.vehicleCategory.findUnique({
      where: { slug: dto.categorySlug },
    });
    if (!category) throw new NotFoundException(`Unknown vehicle category "${dto.categorySlug}".`);

    const vehicle = await this.prisma.vehicle.create({
      data: {
        agencyId: caller.agencyId,
        categoryId: category.id,
        licensePlate: dto.licensePlate,
        chassisNumber: dto.chassisNumber,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        color: dto.color,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        seats: dto.seats ?? 5,
        doors: dto.doors ?? 4,
        currentMileageKm: dto.currentMileageKm ?? 0,
        dailyRateDA: dto.dailyRateDA,
        weeklyRateDA: dto.weeklyRateDA,
        monthlyRateDA: dto.monthlyRateDA,
        depositAmountDA: dto.depositAmountDA ?? 0,
        gpsDeviceId: dto.gpsDeviceId,
        gpsImei: dto.gpsImei,
        hasGpsDevice: !!dto.gpsDeviceId,
        features: dto.features ?? [],
        notes: dto.notes,
        status: VehicleStatus.PENDING_INSPECTION, // gated to AVAILABLE after compliance
      },
    });
    await this.audit.log({
      userId: caller.id,
      entityType: 'Vehicle',
      entityId: vehicle.id,
      action: 'VEHICLE_CREATED',
      newValue: { licensePlate: dto.licensePlate },
    });
    return vehicle;
  }

  async list(caller: AuthenticatedUser, page = 1, limit = 20, status?: VehicleStatus) {
    const where = {
      deletedAt: null,
      ...(caller.role !== UserRole.ADMIN && { agencyId: caller.agencyId ?? '__none__' }),
      ...(status && { status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { slug: true, nameFr: true, nameAr: true } },
          // Latest expiries so the dashboard renders real days-to-expiry dots.
          insurancePolicies: {
            where: { isActive: true },
            orderBy: { endDate: 'desc' },
            take: 1,
            select: { endDate: true },
          },
          documents: {
            where: { documentType: VehicleDocumentType.VISITE_TECHNIQUE },
            orderBy: { version: 'desc' },
            take: 1,
            select: { expiresAt: true },
          },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return { items, total, page };
  }

  async getById(vehicleId: string, caller: AuthenticatedUser) {
    const v = await this.withAccess(vehicleId, caller);
    const [documents, insurance] = await Promise.all([
      this.prisma.vehicleDocument.findMany({
        where: { vehicleId },
        orderBy: [{ documentType: 'asc' }, { version: 'desc' }],
      }),
      this.prisma.insurancePolicy.findMany({
        where: { vehicleId, isActive: true },
        orderBy: { endDate: 'desc' },
      }),
    ]);
    return { ...v, documents, insurance };
  }

  async update(vehicleId: string, caller: AuthenticatedUser, dto: UpdateVehicleDto) {
    await this.withAccess(vehicleId, caller);
    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...dto,
        ...(dto.availableFrom !== undefined && {
          availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
        }),
        ...(dto.availableUntil !== undefined && {
          availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null,
        }),
        ...(dto.gpsDeviceId !== undefined && { hasGpsDevice: !!dto.gpsDeviceId }),
      },
    });
    return updated;
  }

  async softDelete(vehicleId: string, caller: AuthenticatedUser) {
    const v = await this.withAccess(vehicleId, caller);
    if (v.status === VehicleStatus.RENTED) {
      throw new BusinessRuleException(
        'VEHICLE_RENTED',
        'Cannot delete a vehicle that is currently rented.',
      );
    }
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { deletedAt: new Date(), status: VehicleStatus.OUT_OF_SERVICE },
    });
    return { id: vehicleId, deleted: true };
  }

  // ── Photos ────────────────────────────────────────────────────────────────
  async photoIntent(vehicleId: string, caller: AuthenticatedUser, dto: VehiclePhotoIntentDto) {
    const v = await this.withAccess(vehicleId, caller);
    const fileKey = this.storage.buildKey(
      `vehicles/${v.agencyId}/${vehicleId}/photos`,
      dto.mimeType,
    );
    return {
      fileKey,
      uploadUrl: await this.storage.presignUpload('vehicles', fileKey, dto.mimeType),
      expiresInSeconds: 300,
    };
  }

  async addPhoto(vehicleId: string, caller: AuthenticatedUser, dto: AddVehiclePhotoDto) {
    const v = await this.withAccess(vehicleId, caller);
    if (!dto.fileKey.startsWith(`vehicles/${v.agencyId}/${vehicleId}/`)) {
      throw new ForbiddenException('fileKey does not belong to this vehicle.');
    }
    await this.storage.verifyObject('vehicles', dto.fileKey, PHOTO_MAX);
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { photos: { push: dto.fileKey } },
    });
    return { added: dto.fileKey };
  }

  // ── Compliance documents (versioned) ──────────────────────────────────────
  async docIntent(vehicleId: string, caller: AuthenticatedUser, dto: VehicleDocIntentDto) {
    const v = await this.withAccess(vehicleId, caller);
    const fileKey = this.storage.buildKey(
      `vehicles/${v.agencyId}/${vehicleId}/docs/${dto.documentType.toLowerCase()}`,
      dto.mimeType,
    );
    return {
      fileKey,
      uploadUrl: await this.storage.presignUpload('vehicles', fileKey, dto.mimeType),
      expiresInSeconds: 300,
    };
  }

  async submitDoc(vehicleId: string, caller: AuthenticatedUser, dto: SubmitVehicleDocDto) {
    const v = await this.withAccess(vehicleId, caller);
    if (!dto.fileKey.startsWith(`vehicles/${v.agencyId}/${vehicleId}/`)) {
      throw new ForbiddenException('fileKey does not belong to this vehicle.');
    }
    const { mimeType } = await this.storage.verifyObject('vehicles', dto.fileKey, DOC_MAX);
    const latest = await this.prisma.vehicleDocument.findFirst({
      where: { vehicleId, documentType: dto.documentType },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const doc = await this.prisma.vehicleDocument.create({
      data: {
        vehicleId,
        documentType: dto.documentType,
        version: (latest?.version ?? 0) + 1,
        fileKey: dto.fileKey,
        fileMimeType: mimeType,
        documentNumber: dto.documentNumber,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    const compliance = await this.recomputeCompliance(vehicleId);
    return {
      document: { id: doc.id, documentType: doc.documentType, version: doc.version },
      compliance,
    };
  }

  async addInsurance(vehicleId: string, caller: AuthenticatedUser, dto: AddInsuranceDto) {
    const v = await this.withAccess(vehicleId, caller);
    const policy = await this.prisma.insurancePolicy.create({
      data: {
        vehicleId,
        agencyId: v.agencyId,
        coverageType: dto.coverageType,
        providerName: dto.providerName,
        policyNumber: dto.policyNumber,
        coverageAmountDA: dto.coverageAmountDA,
        premiumDA: dto.premiumDA,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
    const compliance = await this.recomputeCompliance(vehicleId);
    return { policy, compliance };
  }

  /** Recomputes the three AVAILABLE-gating flags; auto-demotes if non-compliant. */
  async recomputeCompliance(vehicleId: string) {
    const now = new Date();
    const [vehicle, insurance, visite] = await Promise.all([
      this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { gpsDeviceId: true, status: true },
      }),
      this.prisma.insurancePolicy.findFirst({
        where: { vehicleId, isActive: true, startDate: { lte: now }, endDate: { gt: now } },
        select: { id: true },
      }),
      this.prisma.vehicleDocument.findFirst({
        where: {
          vehicleId,
          documentType: VehicleDocumentType.VISITE_TECHNIQUE,
          expiresAt: { gt: now },
        },
        select: { id: true },
      }),
    ]);
    if (!vehicle) throw new NotFoundException('Vehicle not found.');
    const flags = {
      hasValidInsurance: !!insurance,
      hasValidVisite: !!visite,
      hasGpsDevice: !!vehicle.gpsDeviceId,
    };
    const demote =
      vehicle.status === VehicleStatus.AVAILABLE &&
      !(flags.hasValidInsurance && flags.hasValidVisite && flags.hasGpsDevice);
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { ...flags, ...(demote && { status: VehicleStatus.PENDING_INSPECTION }) },
    });
    return { ...flags, demotedToPendingInspection: demote };
  }

  async setStatus(vehicleId: string, caller: AuthenticatedUser, dto: SetVehicleStatusDto) {
    await this.withAccess(vehicleId, caller);
    if (dto.status === VehicleStatus.RENTED) {
      throw new BusinessRuleException(
        'RENTED_VIA_BOOKING_ONLY',
        'RENTED is set automatically at booking pickup.',
      );
    }
    if (dto.status === VehicleStatus.AVAILABLE) {
      const c = await this.recomputeCompliance(vehicleId);
      const missing = [
        !c.hasValidInsurance && 'valid insurance policy',
        !c.hasValidVisite && 'valid visite technique',
        !c.hasGpsDevice && 'GPS tracker (platform policy)',
      ].filter(Boolean);
      if (missing.length) {
        throw new BusinessRuleException(
          'VEHICLE_NOT_COMPLIANT',
          `Cannot list as AVAILABLE — missing: ${missing.join(', ')}.`,
        );
      }
    }
    const v = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: dto.status },
    });
    await this.audit.log({
      userId: caller.id,
      entityType: 'Vehicle',
      entityId: vehicleId,
      action: 'STATUS_CHANGED',
      newValue: { status: dto.status },
    });
    return v;
  }

  // ── Client search (Sprint 4) ───────────────────────────────────────────────
  async search(q: SearchVehiclesDto) {
    const from = new Date(q.from);
    const until = new Date(q.until);
    if (until <= from)
      throw new BusinessRuleException('INVALID_PERIOD', 'until must be after from.');
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const where = {
      deletedAt: null,
      status: VehicleStatus.AVAILABLE,
      hasValidInsurance: true,
      hasValidVisite: true,
      hasGpsDevice: true,
      agency: {
        isVerified: true,
        isActive: true,
        isSuspended: false,
        deletedAt: null,
        wilayaId: q.wilayaId,
      },
      ...(q.categorySlug && { category: { slug: q.categorySlug } }),
      ...(q.transmission && { transmission: q.transmission }),
      ...(q.seatsMin && { seats: { gte: q.seatsMin } }),
      AND: [
        { OR: [{ availableFrom: null }, { availableFrom: { lte: from } }] },
        { OR: [{ availableUntil: null }, { availableUntil: { gte: until } }] },
      ],
      NOT: {
        bookings: {
          some: {
            status: { in: BLOCKING_BOOKING_STATUSES },
            OR: [
              { confirmedFrom: { lt: until }, confirmedUntil: { gt: from } },
              { confirmedFrom: null, requestedFrom: { lt: until }, requestedUntil: { gt: from } },
            ],
          },
        },
      },
    };

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          licensePlate: true,
          make: true,
          model: true,
          year: true,
          color: true,
          fuelType: true,
          transmission: true,
          seats: true,
          doors: true,
          features: true,
          photos: true,
          category: { select: { slug: true, nameFr: true, nameAr: true } },
          agency: { select: { id: true, name: true, slug: true, wilayaId: true } },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    // Attach resolved pricing; drop vehicles with no configured rate.
    const items = [];
    for (const v of vehicles) {
      try {
        const r = await this.pricing.resolveRates(v.id);
        items.push({
          ...v,
          pricing: {
            dailyRateDA: r.dailyRateDA,
            depositAmountDA: r.depositAmountDA,
            taxRatePct: r.taxRatePct,
          },
        });
      } catch {
        /* PRICING_NOT_CONFIGURED → not bookable, hide from results */
      }
    }
    return { items, total, page };
  }
}
