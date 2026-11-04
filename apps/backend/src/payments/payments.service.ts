import { Inject, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BookingStatus, PaymentMethod, PaymentStatus, PaymentType, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { ContractsService } from '../contracts/contracts.service';
import { PAYMENT_GATEWAY, IPaymentGateway } from './gateways/payment-gateway.interface';
import { BusinessRuleException } from '../common/exceptions/app.exceptions';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { nowUtc } from '../common/utils/date.util';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly platformConfig: PlatformConfigService,
    private readonly contracts: ContractsService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
  ) {}

  /** Client initiates card payment for an APPROVED/AWAITING_PAYMENT booking. */
  async initiateBookingPayment(
    bookingId: string,
    caller: AuthenticatedUser,
    method: PaymentMethod,
  ) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.clientId !== caller.id) throw new ForbiddenException('Not your booking.');
    if (
      !([BookingStatus.APPROVED, BookingStatus.AWAITING_PAYMENT] as BookingStatus[]).includes(
        booking.status,
      )
    ) {
      throw new BusinessRuleException(
        'NOT_PAYABLE',
        `Booking is ${booking.status}; cannot pay now.`,
      );
    }

    const paymentRef = `PAY-${nowUtc().getUTCFullYear()}-${randomUUID().slice(0, 8)}`;
    const returnUrl = `${this.config.get('CORS_ORIGINS', 'http://localhost:3001').split(',')[0]}/bookings/${bookingId}/payment-return`;
    const init = await this.gateway.initiate({
      orderRef: paymentRef,
      amountDA: Number(booking.totalAmountDA),
      intent: 'capture',
      returnUrl,
    });

    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        paymentRef,
        externalRef: init.externalRef,
        paymentType: PaymentType.BOOKING_PAYMENT,
        paymentMethod: method,
        status: PaymentStatus.PENDING,
        amountDA: booking.totalAmountDA,
        netAmountDA: booking.totalAmountDA,
      },
    });
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.AWAITING_PAYMENT },
    });
    return { paymentId: payment.id, paymentRef, paymentUrl: init.paymentUrl };
  }

  /** Gateway callback / return handler: confirm capture → booking PAID + contract + deposit pre-auth. */
  async confirmBookingPayment(paymentRef: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { paymentRef },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (payment.status === PaymentStatus.CAPTURED) return { alreadyProcessed: true };

    const result = await this.gateway.confirm(payment.externalRef!);
    if (!result.success) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: nowUtc(),
          failureReason: result.errorMessage,
          gatewayResponse: result.rawResponse as Prisma.InputJsonValue,
        },
      });
      throw new BusinessRuleException(
        'PAYMENT_FAILED',
        result.errorMessage ?? 'Card payment failed.',
      );
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.CAPTURED,
        capturedAt: nowUtc(),
        gatewayResponse: result.rawResponse as Prisma.InputJsonValue,
      },
    });
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.PAID },
    });

    await this.generateInvoice(payment.id, payment.bookingId);
    const contract = await this.contracts.generateForBooking(payment.bookingId);
    await this.preAuthorizeDeposit(payment.bookingId, payment.paymentMethod);

    const client = await this.prisma.user.findUnique({
      where: { id: payment.booking.clientId },
      select: { id: true, phone: true, locale: true },
    });
    if (client)
      await this.notifications.sendSms({
        userId: client.id,
        phone: client.phone,
        locale: client.locale as 'fr' | 'ar',
        templateId: 'BOOKING_PAID',
        vars: { bookingRef: payment.booking.bookingRef },
      });
    await this.audit.log({
      entityType: 'Payment',
      entityId: payment.id,
      action: 'PAYMENT_CAPTURED',
      newValue: { bookingRef: payment.booking.bookingRef },
    });
    return { paid: true, contractRef: contract.contractRef };
  }

  /** Security deposit pre-authorisation (held, not captured). */
  private async preAuthorizeDeposit(bookingId: string, method: PaymentMethod) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { depositAmountDA: true, bookingRef: true },
    });
    if (!booking || Number(booking.depositAmountDA) <= 0) return;
    const depositRef = `DEP-${nowUtc().getUTCFullYear()}-${randomUUID().slice(0, 8)}`;
    const init = await this.gateway.initiate({
      orderRef: depositRef,
      amountDA: Number(booking.depositAmountDA),
      intent: 'authorize',
      returnUrl: 'about:blank',
    });
    await this.prisma.payment.create({
      data: {
        bookingId,
        paymentRef: depositRef,
        externalRef: init.externalRef,
        paymentType: PaymentType.SECURITY_DEPOSIT,
        paymentMethod: method,
        status: PaymentStatus.AUTHORIZED,
        authorizedAt: nowUtc(),
        amountDA: booking.depositAmountDA,
        netAmountDA: booking.depositAmountDA,
      },
    });
  }

  /** Release deposit on clean return. */
  async releaseDeposit(bookingId: string) {
    const deposit = await this.prisma.payment.findFirst({
      where: {
        bookingId,
        paymentType: PaymentType.SECURITY_DEPOSIT,
        status: PaymentStatus.AUTHORIZED,
      },
    });
    if (!deposit) return { released: false };
    await this.gateway.release(deposit.externalRef!);
    await this.prisma.payment.update({
      where: { id: deposit.id },
      data: { status: PaymentStatus.RELEASED, releasedAt: nowUtc() },
    });
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: { select: { id: true, phone: true, locale: true } } },
    });
    if (booking)
      await this.notifications.sendSms({
        userId: booking.client.id,
        phone: booking.client.phone,
        locale: booking.client.locale as 'fr' | 'ar',
        templateId: 'DEPOSIT_RELEASED',
        vars: { amount: String(deposit.amountDA), bookingRef: booking.bookingRef },
      });
    return { released: true };
  }

  /** Capture (part of) the deposit for damage/late fees. */
  async captureDeposit(bookingId: string, amountDA: number, paymentType: PaymentType) {
    const deposit = await this.prisma.payment.findFirst({
      where: {
        bookingId,
        paymentType: PaymentType.SECURITY_DEPOSIT,
        status: PaymentStatus.AUTHORIZED,
      },
    });
    if (!deposit)
      throw new BusinessRuleException('NO_DEPOSIT_HOLD', 'No authorised deposit to capture.');
    const res = await this.gateway.capture(deposit.externalRef!, amountDA);
    if (!res.success) throw new BusinessRuleException('CAPTURE_FAILED', 'Deposit capture failed.');
    await this.prisma.payment.update({
      where: { id: deposit.id },
      data: { status: PaymentStatus.CAPTURED, capturedAt: nowUtc() },
    });
    await this.prisma.payment.create({
      data: {
        bookingId,
        paymentRef: `CAP-${randomUUID().slice(0, 8)}`,
        paymentType,
        paymentMethod: deposit.paymentMethod,
        status: PaymentStatus.CAPTURED,
        capturedAt: nowUtc(),
        amountDA: amountDA as unknown as Prisma.Decimal,
        netAmountDA: amountDA as unknown as Prisma.Decimal,
      },
    });
    return { captured: amountDA };
  }

  /** Agency staff records a cash payment (AML cap from config). */
  async recordCash(bookingId: string, caller: AuthenticatedUser, amountDA: number, note?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (caller.agencyId !== booking.agencyId && caller.role !== 'ADMIN')
      throw new ForbiddenException('Wrong agency.');
    const cap = await this.platformConfig.get<number>('cash_payment_max_amount_da', 200000);
    if (amountDA > cap)
      throw new BusinessRuleException(
        'CASH_LIMIT',
        `Cash payments are capped at ${cap} DA (AML policy).`,
      );

    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        paymentRef: `CASH-${nowUtc().getUTCFullYear()}-${randomUUID().slice(0, 8)}`,
        paymentType: PaymentType.BOOKING_PAYMENT,
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.CAPTURED,
        amountDA: amountDA as unknown as Prisma.Decimal,
        netAmountDA: amountDA as unknown as Prisma.Decimal,
        capturedAt: nowUtc(),
        receivedBy: caller.id,
        receivedAt: nowUtc(),
        metadata: note ? ({ note } as Prisma.InputJsonValue) : undefined,
      },
    });
    if (Number(amountDA) >= Number(booking.totalAmountDA)) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.PAID },
      });
      await this.generateInvoice(payment.id, bookingId);
      await this.contracts.generateForBooking(bookingId);
    }
    await this.audit.log({
      userId: caller.id,
      entityType: 'Payment',
      entityId: payment.id,
      action: 'CASH_RECORDED',
      newValue: { amountDA },
    });
    return { paymentId: payment.id, amountDA };
  }

  /** Per-agency sequential invoice (gap-free) via advisory lock. */
  private async generateInvoice(paymentId: string, bookingId: string) {
    const b = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { agencyId: true, subtotalDA: true, taxAmountDA: true, totalAmountDA: true },
    });
    if (!b) return;
    const start = await this.platformConfig.get<number>('invoice_sequential_start', 1000);
    await this.prisma.$transaction(async (tx: any) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'invoice_' + b.agencyId}))`;
      const count = await tx.invoice.count({ where: { agencyId: b.agencyId } });
      const seq = start + count;
      await tx.invoice.create({
        data: {
          invoiceRef: `INV-${b.agencyId.slice(0, 4).toUpperCase()}-${seq}`,
          paymentId,
          agencyId: b.agencyId,
          subtotalDA: b.subtotalDA,
          taxAmountDA: b.taxAmountDA,
          totalDA: b.totalAmountDA,
          taxRatePct: 19 as unknown as Prisma.Decimal,
        },
      });
    });
  }
}
