import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma, UserRole, UserStatus, VehicleStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { PricingService } from '../pricing/pricing.service';
import { KycService } from '../kyc/kyc.service';
import { FraudService, FraudSignalType } from '../fraud/fraud.service';
import { PaymentsService } from '../payments/payments.service';
import { BusinessRuleException } from '../common/exceptions/app.exceptions';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { BLOCKING_BOOKING_STATUSES } from '../common/constants/booking.constants';
import { nowUtc, rentalDays } from '../common/utils/date.util';
import { CreateBookingDto, PickupDto, ReturnDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly platformConfig: PlatformConfigService,
    private readonly pricing: PricingService,
    private readonly kyc: KycService,
    private readonly fraud: FraudService,
    private readonly payments: PaymentsService,
  ) {}

  // ── CREATE (the gated, transactional core) ─────────────────────────────────
  async create(caller: AuthenticatedUser, dto: CreateBookingDto) {
    const from = new Date(dto.requestedFrom);
    const until = new Date(dto.requestedUntil);
    if (until <= from) throw new BusinessRuleException('INVALID_PERIOD', 'Return must be after pickup.');
    if (from < nowUtc()) throw new BusinessRuleException('PAST_DATE', 'Pickup cannot be in the past.');

    // Gate 1: account active
    if (caller.status !== UserStatus.ACTIVE) {
      throw new BusinessRuleException('ACCOUNT_NOT_ACTIVE', 'Your account is not active.');
    }
    // Gate 2: KYC complete (CIN + permis + selfie approved)
    if (!(await this.kyc.isEligibleForBooking(caller.id))) {
      throw new BusinessRuleException('KYC_INCOMPLETE', 'Complete KYC verification (CIN, driving license, selfie) before booking.');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId, deletedAt: null },
      include: { agency: { select: { id: true, acceptsBlacklist: true } } },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found.');
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BusinessRuleException('VEHICLE_UNAVAILABLE', `Vehicle is ${vehicle.status}.`);
    }

    // Gate 3: blacklist (active, non-expired, shared-or-same-agency)
    const now = nowUtc();
    const blacklist = await this.prisma.blacklistEntry.findFirst({
      where: {
        userId: caller.id, isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        AND: [{ OR: [{ agencyId: vehicle.agencyId }, { isShared: true }] }],
      },
      select: { id: true, reason: true },
    });
    if (blacklist && (vehicle.agency.acceptsBlacklist || true)) {
      throw new BusinessRuleException('BLACKLISTED', 'You are blocked from booking due to a prior incident. Contact support.');
    }

    // Gate 4: fraud risk score block threshold
    const blockThreshold = await this.platformConfig.get<number>('fraud_score_block_threshold', 75);
    if (caller.riskScore >= blockThreshold) {
      throw new BusinessRuleException('RISK_BLOCKED', 'Your account is under review and cannot create bookings right now.');
    }

    // Gate 5: concurrent-booking velocity
    const maxConcurrent = await this.platformConfig.get<number>('max_concurrent_bookings_per_client', 2);
    const activeCount = await this.prisma.booking.count({
      where: { clientId: caller.id, status: { in: BLOCKING_BOOKING_STATUSES } },
    });
    if (activeCount >= maxConcurrent) {
      await this.fraud.raiseSignal({ userId: caller.id, signalType: FraudSignalType.MULTIPLE_CONCURRENT_BOOKINGS, severity: 3, description: `Attempted booking with ${activeCount} already active (max ${maxConcurrent}).` });
      throw new BusinessRuleException('TOO_MANY_ACTIVE', `You already have ${activeCount} active booking(s) (max ${maxConcurrent}).`);
    }

    // Price snapshot + cancellation policy snapshot
    const quote = await this.pricing.buildQuote(dto.vehicleId, from, until, {
      additionalDrivers: dto.additionalDrivers, hasChildSeat: dto.hasChildSeat,
      hasGpsScreen: dto.hasGpsScreen, withInsuranceWaiver: dto.withInsuranceWaiver,
    });
    const cancellationPolicySnapshot = {
      free_cancel_hours: await this.platformConfig.get('cancellation_free_hours', 48),
      partial_refund_hours: await this.platformConfig.get('cancellation_partial_refund_hours', 24),
      partial_refund_pct: await this.platformConfig.get('cancellation_partial_refund_pct', 75),
      late_refund_hours: await this.platformConfig.get('cancellation_late_refund_hours', 6),
      late_refund_pct: await this.platformConfig.get('cancellation_late_refund_pct', 50),
      no_refund_hours: await this.platformConfig.get('cancellation_no_refund_hours', 6),
    };
    const cinApproval = await this.kyc.latestCinApproval(caller.id);

    // Serializable transaction: re-check overlap, then create with a unique ref.
    const booking = await this.prisma.$transaction(async (tx: any) => {
      const overlap = await tx.booking.findFirst({
        where: {
          vehicleId: dto.vehicleId, status: { in: BLOCKING_BOOKING_STATUSES },
          OR: [
            { confirmedFrom: { lt: until }, confirmedUntil: { gt: from } },
            { confirmedFrom: null, requestedFrom: { lt: until }, requestedUntil: { gt: from } },
          ],
        },
        select: { id: true },
      });
      if (overlap) throw new BusinessRuleException('DATES_TAKEN', 'These dates are no longer available for this vehicle.');

      const year = now.getUTCFullYear();
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'booking_ref_' + year}))`;
      const count = await tx.booking.count({ where: { bookingRef: { startsWith: `DZR-${year}-` } } });
      const bookingRef = `DZR-${year}-${String(count + 1).padStart(5, '0')}`;

      return tx.booking.create({
        data: {
          bookingRef, clientId: caller.id, agencyId: vehicle.agencyId, vehicleId: dto.vehicleId,
          status: BookingStatus.PENDING,
          requestedFrom: from, requestedUntil: until,
          pickupWilayaId: dto.pickupWilayaId, pickupAddress: dto.pickupAddress, returnAddress: dto.returnAddress,
          isOneWay: !!dto.returnAddress && dto.returnAddress !== dto.pickupAddress,
          dailyRateDA: quote.dailyRateDA as unknown as Prisma.Decimal,
          totalDays: quote.totalDays,
          subtotalDA: quote.subtotalDA as unknown as Prisma.Decimal,
          discountDA: quote.discountDA as unknown as Prisma.Decimal,
          taxAmountDA: quote.taxAmountDA as unknown as Prisma.Decimal,
          insuranceAmountDA: quote.insuranceAmountDA as unknown as Prisma.Decimal,
          depositAmountDA: quote.depositAmountDA as unknown as Prisma.Decimal,
          totalAmountDA: quote.totalAmountDA as unknown as Prisma.Decimal,
          additionalDrivers: dto.additionalDrivers ?? 0,
          hasChildSeat: !!dto.hasChildSeat, hasGpsScreen: !!dto.hasGpsScreen,
          notes: dto.notes,
          cancellationPolicySnapshot: cancellationPolicySnapshot as Prisma.InputJsonValue,
          kycVerifiedAt: cinApproval.reviewedAt, kycApprovedBy: cinApproval.reviewedBy,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // Notify the agency owner (SMS)
    const owner = await this.prisma.agency.findUnique({ where: { id: vehicle.agencyId }, select: { owner: { select: { id: true, phone: true, locale: true } } } });
    if (owner) await this.notifications.sendSms({ userId: owner.owner.id, phone: owner.owner.phone, locale: owner.owner.locale as 'fr' | 'ar', templateId: 'BOOKING_CREATED_AGENCY', vars: { bookingRef: booking.bookingRef, plate: vehicle.licensePlate, from: dto.requestedFrom.slice(0, 10), until: dto.requestedUntil.slice(0, 10) } });
    await this.audit.log({ userId: caller.id, entityType: 'Booking', entityId: booking.id, action: 'BOOKING_CREATED', newValue: { bookingRef: booking.bookingRef } });
    return booking;
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async listMine(caller: AuthenticatedUser, page = 1, limit = 20) {
    const where = { clientId: caller.id };
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { vehicle: { select: { make: true, model: true, licensePlate: true, photos: true } }, agency: { select: { name: true } } },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return { items, total, page };
  }

  async listForAgency(caller: AuthenticatedUser, status?: BookingStatus, page = 1, limit = 20) {
    if (!caller.agencyId) throw new ForbiddenException('Agency context required.');
    const where = { agencyId: caller.agencyId, ...(status && { status }) };
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { client: { select: { firstName: true, lastName: true, phone: true, riskScore: true } }, vehicle: { select: { make: true, model: true, licensePlate: true } } },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return { items, total, page };
  }

  async getById(id: string, caller: AuthenticatedUser) {
    const b = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: { select: { make: true, model: true, licensePlate: true, photos: true } },
        agency: { select: { id: true, name: true, phone: true } },
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        rentalContract: { select: { contractRef: true, clientSignedAt: true } },
        payments: { select: { paymentRef: true, paymentType: true, status: true, amountDA: true } },
      },
    });
    if (!b) throw new NotFoundException('Booking not found.');
    const isParty = caller.id === b.clientId || caller.agencyId === b.agencyId || caller.role === UserRole.ADMIN;
    if (!isParty) throw new ForbiddenException('Not your booking.');
    return b;
  }

  // ── Agency transitions ──────────────────────────────────────────────────────
  private async loadAgencyBooking(id: string, caller: AuthenticatedUser) {
    const b = await this.prisma.booking.findUnique({ where: { id }, include: { client: { select: { id: true, phone: true, locale: true } } } });
    if (!b) throw new NotFoundException('Booking not found.');
    if (caller.agencyId !== b.agencyId && caller.role !== UserRole.ADMIN) throw new ForbiddenException('Wrong agency.');
    return b;
  }

  async approve(id: string, caller: AuthenticatedUser) {
    const b = await this.loadAgencyBooking(id, caller);
    if (b.status !== BookingStatus.PENDING) throw new BusinessRuleException('INVALID_TRANSITION', `Cannot approve a ${b.status} booking.`);
    const updated = await this.prisma.booking.update({
      where: { id }, data: { status: BookingStatus.AWAITING_PAYMENT, confirmedFrom: b.requestedFrom, confirmedUntil: b.requestedUntil },
    });
    await this.notifications.sendSms({ userId: b.client.id, phone: b.client.phone, locale: b.client.locale as 'fr' | 'ar', templateId: 'BOOKING_APPROVED', vars: { bookingRef: b.bookingRef } });
    await this.audit.log({ userId: caller.id, entityType: 'Booking', entityId: id, action: 'BOOKING_APPROVED' });
    return updated;
  }

  async reject(id: string, caller: AuthenticatedUser, reason: string) {
    const b = await this.loadAgencyBooking(id, caller);
    if (b.status !== BookingStatus.PENDING) throw new BusinessRuleException('INVALID_TRANSITION', `Cannot reject a ${b.status} booking.`);
    const updated = await this.prisma.booking.update({
      where: { id }, data: { status: BookingStatus.CANCELLED_AGENCY, cancelledAt: nowUtc(), cancelledBy: caller.id, cancellationReason: reason },
    });
    await this.notifications.sendSms({ userId: b.client.id, phone: b.client.phone, locale: b.client.locale as 'fr' | 'ar', templateId: 'BOOKING_REJECTED', vars: { bookingRef: b.bookingRef, reason } });
    return updated;
  }

  async pickup(id: string, caller: AuthenticatedUser, dto: PickupDto) {
    const b = await this.loadAgencyBooking(id, caller);
    if (b.status !== BookingStatus.PAID) throw new BusinessRuleException('INVALID_TRANSITION', 'Booking must be PAID before pickup.');
    const contract = await this.prisma.rentalContract.findUnique({ where: { bookingId: id }, select: { clientSignedAt: true } });
    if (!contract?.clientSignedAt) throw new BusinessRuleException('CONTRACT_UNSIGNED', 'Client must sign the contract before vehicle handover.');

    const updated = await this.prisma.$transaction(async (tx: any) => {
      await tx.vehicle.update({ where: { id: b.vehicleId }, data: { status: VehicleStatus.RENTED, currentMileageKm: dto.mileageAtPickupKm } });
      await tx.rentalContract.update({ where: { bookingId: id }, data: { pickupConditionPhotos: dto.photos ?? [], pickupConditionNotes: dto.notes, pickupFuelLevel: dto.fuelLevel } });
      return tx.booking.update({ where: { id }, data: { status: BookingStatus.ACTIVE, actualPickupAt: nowUtc(), mileageAtPickupKm: dto.mileageAtPickupKm } });
    });
    await this.audit.log({ userId: caller.id, entityType: 'Booking', entityId: id, action: 'BOOKING_PICKED_UP' });
    return updated;
  }

  async return(id: string, caller: AuthenticatedUser, dto: ReturnDto) {
    const b = await this.loadAgencyBooking(id, caller);
    if (b.status !== BookingStatus.ACTIVE) throw new BusinessRuleException('INVALID_TRANSITION', 'Booking must be ACTIVE to return.');

    // Late-return penalty (Algerian clause): ≤2h → ½ day, <24h → 1 day, ≥24h → DISPUTED + days×daily.
    const dueAt = b.confirmedUntil ?? b.requestedUntil;
    const lateMs = nowUtc().getTime() - dueAt.getTime();
    const lateHours = Math.max(0, Math.ceil(lateMs / 3_600_000));
    const daily = Number(b.dailyRateDA);
    let penalty = 0; let dispute = false;
    if (lateHours > 0 && lateHours <= 2) penalty = daily * 0.5;
    else if (lateHours > 2 && lateHours < 24) penalty = daily;
    else if (lateHours >= 24) { penalty = Math.ceil(lateHours / 24) * daily; dispute = true; }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      await tx.vehicle.update({ where: { id: b.vehicleId }, data: { status: VehicleStatus.AVAILABLE, currentMileageKm: dto.mileageAtReturnKm } });
      await tx.rentalContract.update({ where: { bookingId: id }, data: { returnConditionPhotos: dto.photos ?? [], returnConditionNotes: dto.notes, returnFuelLevel: dto.fuelLevel, lateReturnPenaltyDA: penalty as unknown as Prisma.Decimal, lateReturnHours: lateHours } });
      return tx.booking.update({ where: { id }, data: { status: dispute ? BookingStatus.DISPUTED : BookingStatus.COMPLETED, actualReturnAt: nowUtc(), mileageAtReturnKm: dto.mileageAtReturnKm } });
    });

    // Deposit handling: clean + on-time → release; late → capture penalty from deposit.
    if (penalty > 0) {
      await this.payments.captureDeposit(id, penalty, 'LATE_FEE' as any).catch((e) => this.logger.warn(`Deposit capture skipped: ${(e as Error).message}`));
    } else {
      await this.payments.releaseDeposit(id).catch((e) => this.logger.warn(`Deposit release skipped: ${(e as Error).message}`));
    }
    await this.audit.log({ userId: caller.id, entityType: 'Booking', entityId: id, action: 'BOOKING_RETURNED', newValue: { lateHours, penalty, dispute } });
    return { ...updated, lateHours, lateReturnPenaltyDA: penalty };
  }

  // ── Client cancellation (policy-snapshot driven) ────────────────────────────
  async cancel(id: string, caller: AuthenticatedUser) {
    const b = await this.prisma.booking.findUnique({ where: { id }, include: { client: { select: { id: true, phone: true, locale: true } } } });
    if (!b) throw new NotFoundException('Booking not found.');
    if (b.clientId !== caller.id) throw new ForbiddenException('Not your booking.');
    if (!([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.AWAITING_PAYMENT, BookingStatus.PAID] as BookingStatus[]).includes(b.status)) {
      throw new BusinessRuleException('NOT_CANCELLABLE', `A ${b.status} booking cannot be cancelled.`);
    }
    const policy = (b.cancellationPolicySnapshot ?? {}) as Record<string, number>;
    const start = b.confirmedFrom ?? b.requestedFrom;
    const hoursBefore = (start.getTime() - nowUtc().getTime()) / 3_600_000;
    let refundPct = 0;
    if (hoursBefore >= (policy.free_cancel_hours ?? 48)) refundPct = 100;
    else if (hoursBefore >= (policy.partial_refund_hours ?? 24)) refundPct = policy.partial_refund_pct ?? 75;
    else if (hoursBefore >= (policy.late_refund_hours ?? 6)) refundPct = policy.late_refund_pct ?? 50;
    else refundPct = 0;
    const refundDA = Math.round((Number(b.totalAmountDA) * refundPct) / 100);

    const updated = await this.prisma.booking.update({
      where: { id }, data: { status: BookingStatus.CANCELLED_CLIENT, cancelledAt: nowUtc(), cancelledBy: caller.id, cancellationReason: `Client cancellation — ${refundPct}% refund` },
    });
    await this.notifications.sendSms({ userId: b.client.id, phone: b.client.phone, locale: b.client.locale as 'fr' | 'ar', templateId: 'BOOKING_CANCELLED', vars: { bookingRef: b.bookingRef, refundPct, refundDA } });
    await this.audit.log({ userId: caller.id, entityType: 'Booking', entityId: id, action: 'BOOKING_CANCELLED_CLIENT', newValue: { refundPct, refundDA } });
    return { ...updated, refundPct, refundDA };
  }
}
