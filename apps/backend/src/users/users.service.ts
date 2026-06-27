import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, UserResponseDto, AdminUserResponseDto } from './dto/user.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

// ─────────────────────────────────────────────────────────────────────────────
// Prisma select sets — explicitly typed to prevent accidental field leakage.
//
// NEVER use: prisma.user.findUnique({ select: undefined })  ← returns ALL fields
// including otpHash, riskFlags, lastLoginIp — which must NEVER reach an API response.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fields safe for the authenticated user to read about themselves.
 * Excludes: otpHash, otpExpiresAt, otpAttempts, riskScore, riskFlags,
 *           lastLoginIp, nationalIdNumber (KYC, not a profile field).
 */
const CLIENT_SAFE_SELECT = {
  id: true,
  phone: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  locale: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  // KYC summary — shown in profile so client knows their verification status
  kycDocuments: {
    where: { status: { in: ['APPROVED', 'PENDING_REVIEW', 'REJECTED'] } },
    select: {
      documentType: true,
      status: true,
      expiresAt: true,
      version: true,
    },
    orderBy: { version: 'desc' },
    // Only latest version per type (deduplication in service layer)
  },
} satisfies Prisma.UserSelect;

/**
 * Admin-extended select — includes risk/fraud fields and nationalIdNumber.
 * ONLY used when caller.role === ADMIN.
 */
const ADMIN_SELECT = {
  ...CLIENT_SAFE_SELECT,
  nationalIdNumber: true,
  riskScore: true,
  riskFlags: true,
  lastLoginAt: true,
  lastLoginIp: true,
  otpAttempts: true,           // Useful for support — not the hash
  deletedAt: true,
  // Staff relationship
  agencyStaff: {
    select: {
      agencyId: true,
      staffRole: true,
      isActive: true,
      hiredAt: true,
    },
  },
  // Owned agencies
  ownedAgencies: {
    select: {
      id: true,
      name: true,
      wilayaId: true,
      isVerified: true,
      isActive: true,
    },
    where: { deletedAt: null },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET OWN PROFILE ────────────────────────────────────────────────────────

  /**
   * Returns the authenticated user's own profile with KYC document summary.
   * KYC documents are deduped to show only the latest version per type.
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, ...this.prisma.notDeleted() },
      select: CLIENT_SAFE_SELECT,
    });

    if (!user) throw new NotFoundException('User profile not found.');

    // Dedupe KYC docs: keep latest version per documentType
    const latestKyc = this.dedupeKycByType(user.kycDocuments);

    return plainToInstance(
      UserResponseDto,
      { ...user, kycDocuments: latestKyc },
      { excludeExtraneousValues: true },
    );
  }

  // ── UPDATE OWN PROFILE ─────────────────────────────────────────────────────

  /**
   * Partial update — only provided fields are changed.
   *
   * Constraints:
   *  - Phone changes require OTP re-verification (separate flow, not here)
   *  - Email uniqueness is pre-checked for a cleaner error message than P2002
   *  - nationalIdNumber is set exclusively by the KYC module (Sprint 2.2)
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    // ── Email uniqueness pre-check ────────────────────────────────────────
    if (dto.email) {
      const taken = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          id: { not: userId },
          deletedAt: null,
        },
        select: { id: true },
      });

      if (taken) {
        throw new ConflictException(
          'This email address is already linked to another account.',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        // Only include fields that were explicitly provided in the DTO
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.locale !== undefined && { locale: dto.locale }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: CLIENT_SAFE_SELECT,
    });

    const latestKyc = this.dedupeKycByType(updated.kycDocuments);

    return plainToInstance(
      UserResponseDto,
      { ...updated, kycDocuments: latestKyc },
      { excludeExtraneousValues: true },
    );
  }

  // ── ADMIN: GET ANY USER ────────────────────────────────────────────────────

  /**
   * Admin-only: full user record including risk fields, nationalIdNumber,
   * agency relationships, and login metadata.
   *
   * Non-admin users can only retrieve their own record via getProfile().
   * Any attempt to read another user's data returns 403.
   */
  async getUserById(
    targetUserId: string,
    caller: AuthenticatedUser,
  ): Promise<UserResponseDto | AdminUserResponseDto> {
    const isOwnProfile = caller.id === targetUserId;
    const isAdmin = caller.role === UserRole.ADMIN;

    if (!isAdmin && !isOwnProfile) {
      throw new ForbiddenException('You can only view your own profile.');
    }

    if (isAdmin) {
      const user = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: ADMIN_SELECT,
      });

      if (!user) throw new NotFoundException(`User ${targetUserId} not found.`);

      const latestKyc = this.dedupeKycByType(user.kycDocuments);

      return plainToInstance(
        AdminUserResponseDto,
        { ...user, kycDocuments: latestKyc },
        { excludeExtraneousValues: true },
      );
    }

    return this.getProfile(targetUserId);
  }

  // ── ADMIN: LIST USERS ──────────────────────────────────────────────────────

  async listUsers(
    caller: AuthenticatedUser,
    options: { page: number; limit: number; role?: UserRole; status?: string },
  ): Promise<{ data: UserResponseDto[]; total: number; page: number }> {
    if (caller.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }

    const { page, limit, role, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(role && { role }),
      ...(status && { status: status as never }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: CLIENT_SAFE_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((u: any) => {
      const latestKyc = this.dedupeKycByType(u.kycDocuments);
      return plainToInstance(
        UserResponseDto,
        { ...u, kycDocuments: latestKyc },
        { excludeExtraneousValues: true },
      );
    });

    return { data, total, page };
  }

  // ── SOFT DELETE (GDPR Erasure Request) ────────────────────────────────────

  /**
   * Initiates account deletion by setting deletedAt.
   *
   * Full GDPR erasure (PII anonymisation) is a Sprint 5 task.
   * This marks the account as deleted and blocks future logins.
   *
   * Precondition: user must have no ACTIVE or PAID bookings.
   * (Full booking check added in Sprint 4 when Booking module exists)
   */
  async deleteOwnAccount(userId: string): Promise<{ message: string }> {
    // Guard: cannot delete if there are active bookings
    // (Sprint 4 will add: where: { clientId: userId, status: { in: [ACTIVE, PAID] } })
    const activeBookingsCount = 0; // placeholder — BookingService not yet available

    if (activeBookingsCount > 0) {
      throw new BadRequestException(
        'You have active rentals. Please return the vehicle before deleting your account.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: this.prisma.softDelete(),
    });

    return {
      message:
        'Your account has been scheduled for deletion. ' +
        'If you have active bookings they must be resolved first.',
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Returns only the latest version of each KYC document type.
   * The DB query fetches all versions ordered by version DESC;
   * this picks the first (latest) occurrence of each documentType.
   */
  private dedupeKycByType<T extends { documentType: string; version: number }>(
    docs: T[],
  ): T[] {
    const seen = new Set<string>();
    return docs.filter((doc) => {
      if (seen.has(doc.documentType)) return false;
      seen.add(doc.documentType);
      return true;
    });
  }
}
