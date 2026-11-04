import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StaffRole, UserRole, UserStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BusinessRuleException } from '../common/exceptions/app.exceptions';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  AddStaffDto,
  AgencyUploadIntentDto,
  CreateAgencyDto,
  SubmitAgencyDocumentDto,
  UpdateAgencyDto,
  VerifyAgencyDto,
} from './dto/agency.dto';

const AGENCY_DOC_MAX_BYTES = 10 * 1024 * 1024;

@Injectable()
export class AgenciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Caller must be the owner of agencyId, an active staff member, or ADMIN. */
  private async assertAgencyAccess(
    agencyId: string,
    caller: AuthenticatedUser,
    ownerOnly = false,
  ): Promise<void> {
    if (caller.role === UserRole.ADMIN) return;
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId, deletedAt: null },
      select: { ownerId: true },
    });
    if (!agency) throw new NotFoundException('Agency not found.');
    if (agency.ownerId === caller.id) return;
    if (!ownerOnly && caller.role === UserRole.AGENCY_STAFF && caller.agencyId === agencyId) return;
    throw new ForbiddenException('You do not have access to this agency.');
  }

  // ── Create (onboarding step 1) ───────────────────────────────────────────
  async create(caller: AuthenticatedUser, dto: CreateAgencyDto) {
    const slug =
      dto.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 90) +
      '-' +
      randomBytes(3).toString('hex');

    const agency = await this.prisma.agency.create({
      data: {
        ownerId: caller.id,
        wilayaId: dto.wilayaId,
        name: dto.name,
        nameAr: dto.nameAr,
        slug,
        phone: dto.phone,
        address: dto.address,
        commune: dto.commune,
        registrationNo: dto.registrationNo,
        taxId: dto.taxId,
        description: dto.description,
        isVerified: false, // DzRent admin reviews documents first
      },
    });

    // CLIENT creating their first agency is promoted to AGENCY_OWNER.
    // Their current access token still carries role=CLIENT — the response
    // tells the frontend to refresh tokens so the new role takes effect.
    let rolePromoted = false;
    if (caller.role === UserRole.CLIENT) {
      await this.prisma.user.update({
        where: { id: caller.id },
        data: { role: UserRole.AGENCY_OWNER },
      });
      rolePromoted = true;
    }

    await this.audit.log({
      userId: caller.id,
      entityType: 'Agency',
      entityId: agency.id,
      action: 'AGENCY_CREATED',
      newValue: { name: agency.name, wilayaId: agency.wilayaId },
    });

    return {
      agency,
      rolePromoted,
      nextSteps: rolePromoted
        ? 'Role upgraded to AGENCY_OWNER — refresh your tokens (POST /auth/refresh), then upload RC + NIF documents for verification.'
        : 'Upload RC + NIF documents for verification.',
    };
  }

  // ── Verification documents ───────────────────────────────────────────────
  async uploadIntent(agencyId: string, caller: AuthenticatedUser, dto: AgencyUploadIntentDto) {
    await this.assertAgencyAccess(agencyId, caller, true);
    const fileKey = this.storage.buildKey(
      `agencies/${agencyId}/${dto.documentType.toLowerCase()}`,
      dto.mimeType,
    );
    const uploadUrl = await this.storage.presignUpload('kyc', fileKey, dto.mimeType); // same encrypted bucket
    return { fileKey, uploadUrl, expiresInSeconds: 300 };
  }

  async submitDocument(agencyId: string, caller: AuthenticatedUser, dto: SubmitAgencyDocumentDto) {
    await this.assertAgencyAccess(agencyId, caller, true);
    if (!dto.fileKey.startsWith(`agencies/${agencyId}/`)) {
      throw new ForbiddenException('fileKey does not belong to this agency.');
    }
    const { mimeType } = await this.storage.verifyObject('kyc', dto.fileKey, AGENCY_DOC_MAX_BYTES);
    const doc = await this.prisma.agencyDocument.create({
      data: {
        agencyId,
        documentType: dto.documentType,
        fileKey: dto.fileKey,
        fileMimeType: mimeType,
      },
    });
    return { id: doc.id, documentType: doc.documentType };
  }

  // ── Admin verification ───────────────────────────────────────────────────
  async pendingVerification(page = 1, limit = 20) {
    const where = { isVerified: false, deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.agency.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          wilayaId: true,
          registrationNo: true,
          taxId: true,
          createdAt: true,
          owner: { select: { firstName: true, lastName: true, phone: true } },
          documents: {
            select: { id: true, documentType: true, isApproved: true, createdAt: true },
          },
        },
      }),
      this.prisma.agency.count({ where }),
    ]);
    return { items, total, page };
  }

  async verify(agencyId: string, adminId: string, dto: VerifyAgencyDto) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId, deletedAt: null },
      include: { owner: { select: { id: true, phone: true, locale: true } } },
    });
    if (!agency) throw new NotFoundException('Agency not found.');
    if (agency.isVerified && dto.approved) {
      throw new BusinessRuleException('ALREADY_VERIFIED', 'Agency is already verified.');
    }

    if (dto.approved) {
      await this.prisma.agency.update({
        where: { id: agencyId },
        data: { isVerified: true, verifiedAt: new Date(), verifiedBy: adminId },
      });
      await this.notifications.sendSms({
        userId: agency.owner.id,
        phone: agency.owner.phone,
        locale: agency.owner.locale as 'fr' | 'ar',
        templateId: 'AGENCY_VERIFIED',
        vars: { agencyName: agency.name },
      });
    } else {
      await this.prisma.agency.update({
        where: { id: agencyId },
        data: { isVerified: false, suspensionReason: dto.notes ?? 'Documents insuffisants' },
      });
    }
    await this.audit.log({
      userId: adminId,
      entityType: 'Agency',
      entityId: agencyId,
      action: dto.approved ? 'AGENCY_VERIFIED' : 'AGENCY_VERIFICATION_REJECTED',
      newValue: { notes: dto.notes },
    });
    return { id: agencyId, isVerified: dto.approved };
  }

  // ── Profile ──────────────────────────────────────────────────────────────
  async getMine(caller: AuthenticatedUser) {
    if (caller.role === UserRole.AGENCY_STAFF && caller.agencyId) {
      return this.getById(caller.agencyId, caller);
    }
    const agencies = await this.prisma.agency.findMany({
      where: { ownerId: caller.id, deletedAt: null },
      include: {
        wilaya: { select: { nameFr: true, nameAr: true } },
        _count: { select: { vehicles: true, staff: true } },
      },
    });
    return agencies;
  }

  async getById(agencyId: string, caller: AuthenticatedUser) {
    await this.assertAgencyAccess(agencyId, caller);
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId, deletedAt: null },
      include: {
        wilaya: { select: { nameFr: true, nameAr: true } },
        _count: { select: { vehicles: true, staff: true, bookings: true } },
      },
    });
    if (!agency) throw new NotFoundException('Agency not found.');
    return agency;
  }

  async update(agencyId: string, caller: AuthenticatedUser, dto: UpdateAgencyDto) {
    await this.assertAgencyAccess(agencyId, caller, true);
    return this.prisma.agency.update({ where: { id: agencyId }, data: { ...dto } });
  }

  // ── Staff management ─────────────────────────────────────────────────────
  async addStaff(agencyId: string, caller: AuthenticatedUser, dto: AddStaffDto) {
    await this.assertAgencyAccess(agencyId, caller, true);

    // Find-or-create the user by phone. New users complete OTP later.
    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.AGENCY_STAFF,
          status: UserStatus.PENDING_VERIFICATION,
        },
      });
    } else {
      const existing = await this.prisma.agencyStaff.findUnique({ where: { userId: user.id } });
      if (existing) {
        throw new BusinessRuleException(
          'ALREADY_STAFF',
          'This person is already staff at an agency.',
        );
      }
      if (user.role === UserRole.CLIENT) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.AGENCY_STAFF },
        });
      } else if (user.role !== UserRole.AGENCY_STAFF) {
        throw new BusinessRuleException(
          'INVALID_ROLE',
          `Cannot add a ${user.role} as agency staff.`,
        );
      }
    }

    const staff = await this.prisma.agencyStaff.create({
      data: { userId: user.id, agencyId, staffRole: dto.staffRole ?? StaffRole.AGENT },
    });
    await this.audit.log({
      userId: caller.id,
      entityType: 'AgencyStaff',
      entityId: staff.id,
      action: 'STAFF_ADDED',
      newValue: { phone: dto.phone, staffRole: dto.staffRole },
    });
    return { staffId: staff.id, userId: user.id, staffRole: staff.staffRole };
  }

  async listStaff(agencyId: string, caller: AuthenticatedUser) {
    await this.assertAgencyAccess(agencyId, caller);
    return this.prisma.agencyStaff.findMany({
      where: { agencyId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true, status: true } },
      },
      orderBy: { hiredAt: 'asc' },
    });
  }

  async removeStaff(agencyId: string, staffId: string, caller: AuthenticatedUser) {
    await this.assertAgencyAccess(agencyId, caller, true);
    const staff = await this.prisma.agencyStaff.findFirst({ where: { id: staffId, agencyId } });
    if (!staff) throw new NotFoundException('Staff member not found in this agency.');
    await this.prisma.agencyStaff.update({
      where: { id: staffId },
      data: { isActive: false, firedAt: new Date() },
    });
    return { staffId, isActive: false };
  }
}
