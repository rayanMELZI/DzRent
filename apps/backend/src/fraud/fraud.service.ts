import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/** Signal type codes (non-exhaustive — matches schema comment). */
export const FraudSignalType = {
  MULTIPLE_CONCURRENT_BOOKINGS: 'MULTIPLE_CONCURRENT_BOOKINGS',
  VELOCITY_ABUSE: 'VELOCITY_ABUSE',
  CIN_DUPLICATE: 'CIN_DUPLICATE',
  DOCUMENT_MISMATCH: 'DOCUMENT_MISMATCH',
  SUSPICIOUS_GPS_PATTERN: 'SUSPICIOUS_GPS_PATTERN',
} as const;

/**
 * FraudService — creates signals and recomputes User.riskScore.
 * Scoring: each unresolved signal contributes severity × 8 (sev 1–5 → 8–40),
 * capped at 100. riskFlags = distinct unresolved signal types.
 * Thresholds (PlatformConfig): review 50 / block 75 / ban 90.
 */
@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async raiseSignal(params: {
    userId: string;
    signalType: string;
    severity: 1 | 2 | 3 | 4 | 5;
    description: string;
    metadata?: unknown;
  }): Promise<void> {
    const { userId, signalType, severity, description, metadata } = params;
    await this.prisma.fraudSignal.create({
      data: { userId, signalType, severity, description, metadata: metadata as never },
    });
    await this.recomputeRiskScore(userId);
    await this.audit.log({
      userId, entityType: 'FraudSignal', entityId: userId,
      action: 'SIGNAL_RAISED', newValue: { signalType, severity },
    });
    this.logger.warn(`Fraud signal [${signalType} sev=${severity}] user=${userId}`);
  }

  async recomputeRiskScore(userId: string): Promise<number> {
    const signals = await this.prisma.fraudSignal.findMany({
      where: { userId, isResolved: false },
      select: { severity: true, signalType: true },
    });
    const score = Math.min(100, signals.reduce((sum: number, s: { severity: number; signalType: string }) => sum + s.severity * 8, 0));
    const flags = [...new Set(signals.map((s: { signalType: string }) => s.signalType))];
    await this.prisma.user.update({
      where: { id: userId },
      data: { riskScore: score, riskFlags: flags as never },
    });
    return score;
  }

  async resolveSignal(signalId: string, adminId: string): Promise<void> {
    const signal = await this.prisma.fraudSignal.update({
      where: { id: signalId },
      data: { isResolved: true, resolvedAt: new Date(), resolvedBy: adminId },
    });
    await this.recomputeRiskScore(signal.userId);
  }

  /** Velocity check: bookings created by user within window (hours). */
  async countRecentBookings(userId: string, windowHours: number): Promise<number> {
    const since = new Date(Date.now() - windowHours * 3_600_000);
    return this.prisma.booking.count({
      where: { clientId: userId, createdAt: { gte: since } },
    });
  }
}
