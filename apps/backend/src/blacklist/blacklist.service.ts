import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessRuleException } from '../common/exceptions/app.exceptions';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AdminReviewBlacklistDto, CreateBlacklistDto } from './dto/blacklist.dto';

/**
 * Cross-agency blacklist federation (schema model):
 * sharesBlacklist agencies contribute; acceptsBlacklist agencies gate bookings
 * against shared entries; isShared=false entries stay private to the reporter.
 */
@Injectable()
export class BlacklistService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async create(caller: AuthenticatedUser, dto: CreateBlacklistDto) {
    if (!caller.agencyId) throw new ForbiddenException('Agency context required.');
    let userId = dto.userId ?? null;
    if (!userId && dto.phone) {
      const u = await this.prisma.user.findUnique({ where: { phone: dto.phone }, select: { id: true } });
      userId = u?.id ?? null;
    }
    if (!userId) {
      throw new BusinessRuleException('USER_NOT_FOUND', 'Blacklist entries require an existing DzRent user (by userId or registered phone).');
    }
    const entry = await this.prisma.blacklistEntry.create({
      data: {
        userId, reportedById: caller.id, agencyId: caller.agencyId,
        reason: dto.reason, description: dto.description, bookingId: dto.bookingId,
        isShared: dto.isShared ?? true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        evidenceKeys: dto.evidenceKeys ?? [],
      },
    });
    await this.audit.log({ userId: caller.id, entityType: 'BlacklistEntry', entityId: entry.id, action: 'BLACKLIST_ADDED', newValue: { targetUserId: userId, reason: dto.reason } });
    return entry;
  }

  /** Visible entries for a target user from the caller-agency's perspective. */
  async check(targetUserId: string, caller: AuthenticatedUser) {
    if (!caller.agencyId && caller.role !== UserRole.ADMIN) throw new ForbiddenException('Agency context required.');
    const now = new Date();
    const entries = await this.prisma.blacklistEntry.findMany({
      where: { userId: targetUserId, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { id: true, agencyId: true, reason: true, description: true, isShared: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
    if (caller.role === UserRole.ADMIN) return { isBlacklisted: entries.length > 0, entries };
    const agency = await this.prisma.agency.findUnique({ where: { id: caller.agencyId! }, select: { acceptsBlacklist: true } });
    const visible = entries.filter((e: any) => e.agencyId === caller.agencyId || (e.isShared && agency?.acceptsBlacklist));
    return { isBlacklisted: visible.length > 0, entries: visible };
  }

  async listMine(caller: AuthenticatedUser, page = 1, limit = 20) {
    if (!caller.agencyId) throw new ForbiddenException('Agency context required.');
    const where = { agencyId: caller.agencyId };
    const [items, total] = await Promise.all([
      this.prisma.blacklistEntry.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, phone: true, firstName: true, lastName: true } } },
      }),
      this.prisma.blacklistEntry.count({ where }),
    ]);
    return { items, total, page };
  }

  async deactivate(entryId: string, caller: AuthenticatedUser) {
    const entry = await this.prisma.blacklistEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entry not found.');
    if (caller.role !== UserRole.ADMIN && entry.agencyId !== caller.agencyId) {
      throw new ForbiddenException('Only the reporting agency (or admin) can deactivate this entry.');
    }
    await this.prisma.blacklistEntry.update({ where: { id: entryId }, data: { isActive: false } });
    return { id: entryId, isActive: false };
  }

  async adminList(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.blacklistEntry.findMany({
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, phone: true, firstName: true, lastName: true, riskScore: true } },
          agency: { select: { id: true, name: true } },
        },
      }),
      this.prisma.blacklistEntry.count(),
    ]);
    return { items, total, page };
  }

  async adminReview(entryId: string, adminId: string, dto: AdminReviewBlacklistDto) {
    const entry = await this.prisma.blacklistEntry.update({
      where: { id: entryId },
      data: { isActive: dto.isActive, reviewedByAdmin: true, adminReviewedAt: new Date(), adminNotes: dto.adminNotes },
    });
    await this.audit.log({ userId: adminId, entityType: 'BlacklistEntry', entityId: entryId, action: 'BLACKLIST_REVIEWED', newValue: { isActive: dto.isActive } });
    return entry;
  }
}
