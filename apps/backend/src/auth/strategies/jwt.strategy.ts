import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * JwtStrategy — validates the short-lived ACCESS token and assembles
 * the full AuthenticatedUser object that is attached to request.user.
 *
 * This is called on EVERY guarded request. The DB lookup here is the
 * single source of truth for the current user's live state:
 *   ① Account still exists (not hard-deleted)
 *   ② Status is ACTIVE (not suspended/banned since token was issued)
 *   ③ Agency context is resolved for AGENCY_OWNER / AGENCY_STAFF
 *
 * Performance note: this is a single indexed query (id PK lookup + optional
 * AgencyStaff join). At high scale, Redis caching of the user record (TTL = 
 * access token lifetime) can replace this, but premature for Sprint 2.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // ── Token type guard ────────────────────────────────────────────────
    if (payload.type !== 'access') {
      throw new UnauthorizedException(
        'Invalid token type — use your access token here.',
      );
    }

    // ── DB lookup: full user + optional agency context ──────────────────
    // We include agencyStaff so agency-scoped users get their agencyId
    // without an additional query in every service method.
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
        deletedAt: null, // Soft-deleted users are fully denied
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        locale: true,
        riskScore: true,
        // Resolve agency context for staff/owner roles
        agencyStaff: {
          select: { agencyId: true, isActive: true },
        },
        // For AGENCY_OWNER: find their primary agency
        ownedAgencies: {
          select: { id: true },
          where: { deletedAt: null, isActive: true },
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // ── Account existence check ─────────────────────────────────────────
    if (!user) {
      throw new UnauthorizedException(
        'Account not found or has been deleted.',
      );
    }

    // ── Live status checks (catches bans issued AFTER token was minted) ─
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'Your account has been temporarily suspended. Please contact support.',
      );
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException(
        'Your account has been permanently banned.',
      );
    }

    // ── Resolve agencyId for multi-tenant isolation ─────────────────────
    // Priority: AgencyStaff record (AGENCY_STAFF) > owned agency (AGENCY_OWNER)
    // CLIENT and ADMIN always get null — they are not tenant-scoped.
    let agencyId: string | null = null;

    if (user.role === UserRole.AGENCY_STAFF && user.agencyStaff?.isActive) {
      agencyId = user.agencyStaff.agencyId;
    } else if (
      user.role === UserRole.AGENCY_OWNER &&
      user.ownedAgencies.length > 0
    ) {
      // Owner's primary agency. Multi-agency switching is handled in Sprint 3
      // via an explicit "switch agency" endpoint that re-issues tokens.
      agencyId = user.ownedAgencies[0].id;
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      locale: user.locale as 'fr' | 'ar',
      agencyId,
      riskScore: user.riskScore,
    };
  }
}
