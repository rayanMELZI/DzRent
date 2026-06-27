import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  userId?: string | null;
  entityType: string;   // "Booking" | "KycDocument" | "Vehicle" | ...
  entityId: string;
  action: string;       // "STATUS_CHANGED" | "DOCUMENT_APPROVED" | ...
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  metadata?: unknown;
}

/**
 * AuditService — append-only trail (Loi 18-05 Art. 9 traceability, 5-yr retention).
 * Fire-and-forget: an audit write failure must NEVER fail the business operation.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          oldValue: entry.oldValue as never,
          newValue: entry.newValue as never,
          ipAddress: entry.ipAddress,
          metadata: entry.metadata as never,
        },
      });
    } catch (e) {
      this.logger.error(`AUDIT WRITE FAILED [${entry.entityType}:${entry.entityId} ${entry.action}]`, e as Error);
    }
  }
}
