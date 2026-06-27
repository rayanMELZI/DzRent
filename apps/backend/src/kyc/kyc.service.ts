import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { KycDocumentType, KycStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FraudService, FraudSignalType } from '../fraud/fraud.service';
import { BusinessRuleException } from '../common/exceptions/app.exceptions';
import { KycUploadIntentDto, SubmitKycDocumentDto, KYC_MAX_BYTES } from './dto/kyc.dto';

/** CIN + permis + selfie required before any rental contract (platform rule). */
const REQUIRED_FOR_BOOKING: KycDocumentType[] = [
  KycDocumentType.CIN,
  KycDocumentType.DRIVING_LICENSE,
  KycDocumentType.SELFIE,
];

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly fraud: FraudService,
  ) {}

  // ── Step 1: presigned upload URL ───────────────────────────────────────────
  async createUploadIntent(userId: string, dto: KycUploadIntentDto) {
    const fileKey = this.storage.buildKey(`kyc/${userId}/${dto.documentType.toLowerCase()}`, dto.mimeType);
    const uploadUrl = await this.storage.presignUpload('kyc', fileKey, dto.mimeType);
    return { fileKey, uploadUrl, expiresInSeconds: 300, maxBytes: KYC_MAX_BYTES };
  }

  // ── Step 2: register the uploaded document (versioned) ────────────────────
  async submitDocument(userId: string, dto: SubmitKycDocumentDto) {
    // Defence: the fileKey must belong to this user's KYC namespace.
    if (!dto.fileKey.startsWith(`kyc/${userId}/`)) {
      throw new ForbiddenException('fileKey does not belong to your upload namespace.');
    }
    const { sizeBytes, mimeType } = await this.storage.verifyObject('kyc', dto.fileKey, KYC_MAX_BYTES);
    const fileHash = await this.storage.sha256Of('kyc', dto.fileKey); // integrity (schema field)

    const latest = await this.prisma.kycDocument.findFirst({
      where: { userId, documentType: dto.documentType },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const doc = await this.prisma.kycDocument.create({
      data: {
        userId,
        documentType: dto.documentType,
        status: KycStatus.PENDING_REVIEW,
        version: (latest?.version ?? 0) + 1,
        fileKey: dto.fileKey,
        fileMimeType: mimeType,
        fileSizeBytes: sizeBytes,
        fileHash,
        documentNumber: dto.documentNumber,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        issuingWilaya: dto.issuingWilaya,
      },
    });

    await this.audit.log({
      userId, entityType: 'KycDocument', entityId: doc.id,
      action: 'DOCUMENT_SUBMITTED', newValue: { documentType: dto.documentType, version: doc.version },
    });
    return { id: doc.id, documentType: doc.documentType, version: doc.version, status: doc.status };
  }

  // ── Client: my KYC status overview ─────────────────────────────────────────
  async getMyStatus(userId: string) {
    const docs = await this.prisma.kycDocument.findMany({
      where: { userId },
      orderBy: { version: 'desc' },
      select: {
        id: true, documentType: true, status: true, version: true,
        expiresAt: true, rejectionReason: true, createdAt: true,
      },
    });
    // latest version per type
    const latestByType = new Map<string, (typeof docs)[number]>();
    for (const d of docs) if (!latestByType.has(d.documentType)) latestByType.set(d.documentType, d);

    const now = new Date();
    const summary = REQUIRED_FOR_BOOKING.map((type) => {
      const doc = latestByType.get(type);
      const expired = doc?.expiresAt != null && doc.expiresAt < now;
      return {
        documentType: type,
        status: doc ? (expired && doc.status === KycStatus.APPROVED ? KycStatus.EXPIRED : doc.status) : KycStatus.NOT_SUBMITTED,
        version: doc?.version ?? 0,
        expiresAt: doc?.expiresAt ?? null,
        rejectionReason: doc?.status === KycStatus.REJECTED ? doc.rejectionReason : null,
      };
    });
    const optional = [...latestByType.values()]
      .filter((d) => !REQUIRED_FOR_BOOKING.includes(d.documentType as KycDocumentType));

    return {
      required: summary,
      optional,
      isEligibleForBooking: summary.every((s) => s.status === KycStatus.APPROVED),
    };
  }

  /** Booking gate — used by BookingsService before any reservation. */
  async isEligibleForBooking(userId: string): Promise<boolean> {
    const status = await this.getMyStatus(userId);
    return status.isEligibleForBooking;
  }

  /** Returns the approval timestamp of the latest APPROVED CIN (booking snapshot). */
  async latestCinApproval(userId: string): Promise<{ reviewedAt: Date | null; reviewedBy: string | null }> {
    const cin = await this.prisma.kycDocument.findFirst({
      where: { userId, documentType: KycDocumentType.CIN, status: KycStatus.APPROVED },
      orderBy: { version: 'desc' },
      select: { reviewedAt: true, reviewedBy: true },
    });
    return { reviewedAt: cin?.reviewedAt ?? null, reviewedBy: cin?.reviewedBy ?? null };
  }

  /** Short-lived signed URL so the admin reviewer can view the document. */
  async getReviewDownloadUrl(documentId: string) {
    const doc = await this.prisma.kycDocument.findUnique({
      where: { id: documentId }, select: { fileKey: true },
    });
    if (!doc) throw new NotFoundException('Document not found.');
    return { url: await this.storage.presignDownload('kyc', doc.fileKey, 300), expiresInSeconds: 300 };
  }

  // ── Admin: review queue ─────────────────────────────────────────────────────
  async reviewQueue(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.kycDocument.findMany({
        where: { status: KycStatus.PENDING_REVIEW },
        orderBy: { createdAt: 'asc' }, // SLA: oldest first (kyc_review_sla_hours)
        skip: (page - 1) * limit, take: limit,
        select: {
          id: true, documentType: true, version: true, createdAt: true,
          documentNumber: true, issuedAt: true, expiresAt: true, issuingWilaya: true,
          user: { select: { id: true, phone: true, firstName: true, lastName: true, riskScore: true } },
        },
      }),
      this.prisma.kycDocument.count({ where: { status: KycStatus.PENDING_REVIEW } }),
    ]);
    return { items, total, page };
  }

  // ── Admin: approve ──────────────────────────────────────────────────────────
  async approve(documentId: string, adminId: string) {
    const doc = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
      include: { user: { select: { id: true, phone: true, locale: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found.');
    if (doc.status !== KycStatus.PENDING_REVIEW) {
      throw new BusinessRuleException('INVALID_KYC_STATE', `Document is ${doc.status}, not PENDING_REVIEW.`);
    }

    await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: { status: KycStatus.APPROVED, reviewedBy: adminId, reviewedAt: new Date() },
    });

    // CIN approval → copy number to User.nationalIdNumber + duplicate check.
    if (doc.documentType === KycDocumentType.CIN && doc.documentNumber) {
      const duplicate = await this.prisma.user.findFirst({
        where: { nationalIdNumber: doc.documentNumber, id: { not: doc.userId }, deletedAt: null },
        select: { id: true },
      });
      await this.prisma.user.update({
        where: { id: doc.userId },
        data: { nationalIdNumber: doc.documentNumber },
      });
      if (duplicate) {
        // Same CIN on two accounts = identity fraud pattern — flag BOTH.
        const desc = `CIN ${doc.documentNumber} appears on multiple accounts.`;
        await this.fraud.raiseSignal({ userId: doc.userId, signalType: FraudSignalType.CIN_DUPLICATE, severity: 5, description: desc });
        await this.fraud.raiseSignal({ userId: duplicate.id, signalType: FraudSignalType.CIN_DUPLICATE, severity: 5, description: desc });
      }
    }

    await this.audit.log({
      userId: adminId, entityType: 'KycDocument', entityId: documentId,
      action: 'DOCUMENT_APPROVED', newValue: { documentType: doc.documentType },
    });
    await this.notifications.sendSms({
      userId: doc.user.id, phone: doc.user.phone, locale: doc.user.locale as 'fr' | 'ar',
      templateId: 'KYC_APPROVED', vars: { docType: doc.documentType },
    });
    return { id: documentId, status: KycStatus.APPROVED };
  }

  // ── Admin: reject ───────────────────────────────────────────────────────────
  async reject(documentId: string, adminId: string, rejectionReason: string) {
    const doc = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
      include: { user: { select: { id: true, phone: true, locale: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found.');
    if (doc.status !== KycStatus.PENDING_REVIEW) {
      throw new BusinessRuleException('INVALID_KYC_STATE', `Document is ${doc.status}, not PENDING_REVIEW.`);
    }

    await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: { status: KycStatus.REJECTED, reviewedBy: adminId, reviewedAt: new Date(), rejectionReason },
    });
    await this.audit.log({
      userId: adminId, entityType: 'KycDocument', entityId: documentId,
      action: 'DOCUMENT_REJECTED', newValue: { rejectionReason },
    });
    await this.notifications.sendSms({
      userId: doc.user.id, phone: doc.user.phone, locale: doc.user.locale as 'fr' | 'ar',
      templateId: 'KYC_REJECTED', vars: { docType: doc.documentType, reason: rejectionReason },
    });
    return { id: documentId, status: KycStatus.REJECTED };
  }
}
