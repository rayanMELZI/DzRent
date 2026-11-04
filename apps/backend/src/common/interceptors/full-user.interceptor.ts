import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Prisma, KycStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Prisma select used to hydrate the full DB user.
 * Deliberately excludes OTP and raw risk fields — those are for internal use.
 * KYC summary is included so routes that need verification status don't need
 * a separate KycService call.
 */
export const FULL_USER_SELECT = {
  id: true,
  phone: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  locale: true,
  avatarUrl: true,
  nationalIdNumber: true,
  riskScore: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  kycDocuments: {
    where: {
      status: {
        in: [KycStatus.PENDING_REVIEW, KycStatus.APPROVED, KycStatus.REJECTED, KycStatus.EXPIRED],
      },
    },
    select: {
      id: true,
      documentType: true,
      status: true,
      version: true,
      expiresAt: true,
      reviewedAt: true,
    },
    orderBy: { version: 'desc' },
  },
} satisfies Prisma.UserSelect;

/** The hydrated DB user shape available via @CurrentDbUser() */
export type FullDbUser = Prisma.UserGetPayload<{ select: typeof FULL_USER_SELECT }>;

/**
 * FullUserInterceptor — fetches the full Prisma User record and attaches it
 * to `request.dbUser` so controllers can access live DB state.
 *
 * ── WHY NOT ALWAYS DO A DB LOOKUP? ───────────────────────────────────────────
 * JwtStrategy.validate() already performs a targeted DB lookup on EVERY guarded
 * request. That lookup is minimal (select a few fields + agencyStaff join) and
 * is necessary for:
 *   ① Account status checks (suspended/banned detection)
 *   ② Agency context resolution for RLS
 *
 * Most endpoints only need what's already in request.user (AuthenticatedUser).
 * Fetching the FULL user profile on every request would add unnecessary latency
 * to simple endpoints like booking searches and fleet queries.
 *
 * ── WHEN TO USE THIS INTERCEPTOR ─────────────────────────────────────────────
 * Apply it only to endpoints that genuinely need fresh DB state beyond the JWT:
 *   - KYC status check before booking creation (real-time, not stale token data)
 *   - Profile endpoints where nationalIdNumber / kycDocuments are returned
 *   - Account settings where riskScore visibility matters
 *
 * ── USAGE ────────────────────────────────────────────────────────────────────
 *
 *   @UseGuards(JwtAuthGuard)
 *   @UseInterceptors(FullUserInterceptor)
 *   @Get('me')
 *   getProfile(@CurrentDbUser() user: FullDbUser) { ... }
 *
 * ── CACHING NOTE (Sprint 5) ───────────────────────────────────────────────────
 * At scale (>1000 concurrent users), cache the DB user in Redis with a TTL
 * matching the access token lifetime (15 min). Cache is busted on:
 *   - Profile update (PATCH /users/me)
 *   - KYC approval/rejection
 *   - Admin status change
 *
 * This is a Sprint 5 optimisation — premature for Sprint 2.
 */
@Injectable()
export class FullUserInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request & { dbUser?: FullDbUser }>();
    const jwtUser = request.user as AuthenticatedUser | undefined;

    if (!jwtUser) {
      // Defensive: FullUserInterceptor must always be paired with JwtAuthGuard
      throw new UnauthorizedException(
        'FullUserInterceptor requires authentication. Ensure JwtAuthGuard runs first.',
      );
    }

    // Hydrate full DB user and attach to request
    const dbUser = await this.prisma.user.findUnique({
      where: { id: jwtUser.id, deletedAt: null },
      select: FULL_USER_SELECT,
    });

    if (!dbUser) {
      throw new UnauthorizedException('User account not found.');
    }

    request.dbUser = dbUser;

    return next.handle();
  }
}
