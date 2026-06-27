import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { hmacSha256Hex } from '../common/utils/crypto.util';
import { BusinessRuleException } from '../common/exceptions/app.exceptions';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { nowUtc } from '../common/utils/date.util';
import { buildContractPdf } from './pdf/contract-pdf';

/**
 * ContractsService — generates the legally-binding rental contract once a
 * booking reaches PAID, applies the active legal clause set (mandatory +
 * wilaya-scoped), renders a bilingual PDF, and records the e-signature.
 */
@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  /** Called by PaymentsService on booking → PAID. Idempotent per booking. */
  async generateForBooking(bookingId: string) {
    const existing = await this.prisma.rentalContract.findUnique({ where: { bookingId } });
    if (existing) return existing;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true, nationalIdNumber: true } },
        agency: { select: { name: true, registrationNo: true, taxId: true, wilayaId: true } },
        vehicle: { select: { make: true, model: true, licensePlate: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found.');

    // Applicable clauses: every active mandatory clause + active optional clauses
    // scoped to this wilaya (empty applicableWilayaIds = national).
    const wilayaId = booking.agency.wilayaId;
    const clauses = await this.prisma.legalClause.findMany({
      where: {
        isActive: true,
        OR: [
          { isMandatory: true },
          { applicableWilayaIds: { isEmpty: true } },
          { applicableWilayaIds: { has: wilayaId } },
        ],
      },
      orderBy: [{ isMandatory: 'desc' }, { clauseCode: 'asc' }],
    });
    const appliedClauses = clauses.map((c: { clauseCode: string }) => c.clauseCode);

    const contractRef = await this.nextContractRef();
    const pdf = await buildContractPdf({ booking, clauses, contractRef });
    const pdfKey = this.storage.buildKey(`contracts/${booking.agencyId}/${bookingId}`, 'application/pdf');
    await this.storage.putBuffer('contracts', pdfKey, pdf, 'application/pdf');

    const contract = await this.prisma.rentalContract.create({
      data: {
        bookingId, contractRef, wilayaId,
        contractPdfKey: pdfKey,
        appliedClauses: appliedClauses as unknown as Prisma.InputJsonValue,
      },
    });
    await this.audit.log({ entityType: 'RentalContract', entityId: contract.id, action: 'CONTRACT_GENERATED', newValue: { contractRef, clauses: appliedClauses.length } });
    return contract;
  }

  async getForBooking(bookingId: string, caller: AuthenticatedUser) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { bookingId },
      include: { booking: { select: { clientId: true, agencyId: true } } },
    });
    if (!contract) throw new NotFoundException('Contract not yet generated.');
    const isParty = caller.id === contract.booking.clientId || caller.agencyId === contract.booking.agencyId || caller.role === 'ADMIN';
    if (!isParty) throw new ForbiddenException('Not a party to this contract.');
    const downloadUrl = contract.contractPdfKey
      ? await this.storage.presignDownload('contracts', contract.signedPdfKey ?? contract.contractPdfKey, 300)
      : null;
    return { ...contract, downloadUrl };
  }

  /** Client e-signature: HMAC over (contractRef + userId + timestamp). */
  async clientSign(bookingId: string, caller: AuthenticatedUser, ip: string) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { bookingId }, include: { booking: { select: { clientId: true } } },
    });
    if (!contract) throw new NotFoundException('Contract not found.');
    if (contract.booking.clientId !== caller.id) throw new ForbiddenException('Only the client can sign.');
    if (contract.clientSignedAt) throw new BusinessRuleException('ALREADY_SIGNED', 'Contract already signed by client.');

    const ts = nowUtc();
    const signatureHash = hmacSha256Hex(this.config.get<string>('APP_SECRET')!, `${contract.contractRef}:${caller.id}:${ts.toISOString()}`);
    const updated = await this.prisma.rentalContract.update({
      where: { bookingId },
      data: { clientSignedAt: ts, clientSignatureHash: signatureHash, clientSignatureIp: ip },
    });
    await this.audit.log({ userId: caller.id, entityType: 'RentalContract', entityId: contract.id, action: 'CONTRACT_SIGNED_CLIENT', ipAddress: ip });
    return { contractRef: updated.contractRef, clientSignedAt: updated.clientSignedAt };
  }

  /** Agency counter-signature at handover. */
  async agencySign(bookingId: string, caller: AuthenticatedUser) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { bookingId }, include: { booking: { select: { agencyId: true } } },
    });
    if (!contract) throw new NotFoundException('Contract not found.');
    if (caller.agencyId !== contract.booking.agencyId && caller.role !== 'ADMIN') throw new ForbiddenException('Wrong agency.');
    const updated = await this.prisma.rentalContract.update({
      where: { bookingId }, data: { agencySignedAt: nowUtc(), agencySignerUserId: caller.id },
    });
    return { contractRef: updated.contractRef, agencySignedAt: updated.agencySignedAt };
  }

  /** CTR-YYYY-NNNNN via advisory lock (gap-free per year). */
  private async nextContractRef(): Promise<string> {
    const year = nowUtc().getUTCFullYear();
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'contract_ref_' + year}))`;
      const count = await tx.rentalContract.count({ where: { contractRef: { startsWith: `CTR-${year}-` } } });
      return `CTR-${year}-${String(count + 1).padStart(5, '0')}`;
    });
  }
}
