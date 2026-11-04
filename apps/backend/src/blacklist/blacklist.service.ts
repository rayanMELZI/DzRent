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
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(caller: AuthenticatedUser, dto: CreateBlacklistDto) {
    if (!caller.agencyId) throw new ForbiddenException('Agency context required.');
    let userId = dto.userId ?? null;
    if (!userId && dto.phone) {
      const u = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
        select: { id: true },
      });
      userId = u?.id ?? null;
    }
    if (!userId) {
      throw new BusinessRuleException(
        'USER_NOT_FOUND',
        'Blacklist entries require an existing DzRent user (by userId or registered phone).',
      );
    }
    const entry = await this.prisma.blacklistEntry.create({
      data: {
        userId,
        reportedById: caller.id,
        agencyId: caller.agencyId,
        reason: dto.reason,
        description: dto.description,
        bookingId: dto.bookingId,
        isShared: dto.isShared ?? true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        evidenceKeys: dto.evidenceKeys ?? [],
      },
    });
    await this.audit.log({
      userId: caller.id,
      entityType: 'BlacklistEntry',
      entityId: entry.id,
      action: 'BLACKLIST_ADDED',
      newValue: { targetUserId: userId, reason: dto.reason },
    });
    return entry;
  }

  /** Visible entries for a target user from the caller-agency's perspective. */
  async check(targetUserId: string, caller: AuthenticatedUser) {
    if (!caller.agencyId && caller.role !== UserRole.ADMIN)
      throw new ForbiddenException('Agency context required.');
    const now = new Date();
    const entries = await this.prisma.blacklistEntry.findMany({
      where: {
        userId: targetUserId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true,
        agencyId: true,
        reason: true,
        description: true,
        isShared: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (caller.role === UserRole.ADMIN) return { isBlacklisted: entries.length > 0, entries };
    const agency = await this.prisma.agency.findUnique({
      where: { id: caller.agencyId! },
      select: { acceptsBlacklist: true },
    });
    const visible = entries.filter(
      (e: any) => e.agencyId === caller.agencyId || (e.isShared && agency?.acceptsBlacklist),
    );
    return { isBlacklisted: visible.length > 0, entries: visible };
  }

  /**
   * The inter-agency view, grouped per person — a strict "rating":
   * every visible entry (own agency + shared federation) carries its mandatory
   * justification, and the count of DISTINCT reporting agencies is surfaced so
   * one grudge reads differently from a cross-agency pattern.
   */
  async listVisible(caller: AuthenticatedUser, q?: string, page = 1, limit = 50) {
    if (!caller.agencyId) throw new ForbiddenException('Agency context required.');
    const now = new Date();
    const agency = await this.prisma.agency.findUnique({
      where: { id: caller.agencyId },
      select: { acceptsBlacklist: true },
    });
    const visibility = agency?.acceptsBlacklist
      ? { OR: [{ agencyId: caller.agencyId }, { isShared: true }] }
      : { agencyId: caller.agencyId };

    const entries = await this.prisma.blacklistEntry.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        AND: [
          visibility,
          ...(q
            ? [
                {
                  user: {
                    OR: [
                      { firstName: { contains: q, mode: 'insensitive' as const } },
                      { lastName: { contains: q, mode: 'insensitive' as const } },
                      { phone: { contains: q } },
                    ],
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // group in memory; the federation list stays small pre-scale
      select: {
        id: true,
        reason: true,
        description: true,
        isShared: true,
        createdAt: true,
        agencyId: true,
        agency: { select: { name: true } },
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    // Group per person, newest activity first.
    const byUser = new Map<string, typeof entries>();
    for (const e of entries) {
      const list = byUser.get(e.user.id) ?? [];
      list.push(e);
      byUser.set(e.user.id, list);
    }
    const people = [...byUser.values()].map((list) => {
      const u = list[0].user;
      return {
        user: {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          initials: `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase(),
          phone: u.phone,
        },
        agencyCount: new Set(list.map((e) => e.agencyId)).size,
        entries: list.map((e) => ({
          id: e.id,
          reason: e.reason,
          description: e.description,
          agencyName: e.agency.name,
          isMine: e.agencyId === caller.agencyId,
          isShared: e.isShared,
          createdAt: e.createdAt.toISOString(),
        })),
      };
    });

    const start = (page - 1) * limit;
    return { items: people.slice(start, start + limit), total: people.length, page };
  }

  async listMine(caller: AuthenticatedUser, page = 1, limit = 20) {
    if (!caller.agencyId) throw new ForbiddenException('Agency context required.');
    const where = { agencyId: caller.agencyId };
    const [items, total] = await Promise.all([
      this.prisma.blacklistEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      throw new ForbiddenException(
        'Only the reporting agency (or admin) can deactivate this entry.',
      );
    }
    await this.prisma.blacklistEntry.update({ where: { id: entryId }, data: { isActive: false } });
    return { id: entryId, isActive: false };
  }

  async adminList(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.blacklistEntry.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, phone: true, firstName: true, lastName: true, riskScore: true },
          },
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
      data: {
        isActive: dto.isActive,
        reviewedByAdmin: true,
        adminReviewedAt: new Date(),
        adminNotes: dto.adminNotes,
      },
    });
    await this.audit.log({
      userId: adminId,
      entityType: 'BlacklistEntry',
      entityId: entryId,
      action: 'BLACKLIST_REVIEWED',
      newValue: { isActive: dto.isActive },
    });
    return entry;
  }
}
