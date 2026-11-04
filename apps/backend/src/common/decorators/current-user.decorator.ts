import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserRole, UserStatus } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// AuthenticatedUser — the shape attached to request.user by JwtStrategy.
//
// This is the CENTRAL identity contract for the entire application.
// Every guard, service, and controller that touches the current user
// reads from this interface — never from the raw JWT payload.
//
// Why richer than the JWT payload?
//   The JWT payload is minimal by design (sub + role + locale).
//   JwtStrategy.validate() does a DB lookup and enriches it with fields
//   that are needed on almost every authenticated request without forcing
//   every service to do its own DB call.
//
// Agency context:
//   agencyId is populated for AGENCY_OWNER / AGENCY_STAFF from their
//   AgencyStaff record. It is NULL for CLIENT and ADMIN roles.
//   This single field drives multi-tenant data isolation in Sprint 3.
// ─────────────────────────────────────────────────────────────────────────────
export interface AuthenticatedUser {
  // ── Identity ───────────────────────────────────────────────────────────
  id: string; // User.id (UUID v4)
  phone: string; // E.164 (+213XXXXXXXXX)
  email: string | null;
  firstName: string;
  lastName: string;

  // ── RBAC ──────────────────────────────────────────────────────────────
  role: UserRole; // From Prisma enum — used by @Roles() + RolesGuard
  status: UserStatus; // Checked by JwtStrategy — suspended/banned ≠ active

  // ── i18n / display ────────────────────────────────────────────────────
  locale: 'fr' | 'ar'; // Drives SMS template language + RTL layout

  // ── Multi-tenancy (Sprint 3 RLS) ──────────────────────────────────────
  // Null for CLIENT and ADMIN (they have no single agency scope).
  // Set by JwtStrategy when role is AGENCY_OWNER or AGENCY_STAFF.
  agencyId: string | null;

  // ── Risk (read-only, for fraud checks inside services) ────────────────
  riskScore: number; // 0–100 — never modify via this object
}

/**
 * @CurrentUser() — extracts the full authenticated user from request.user.
 *
 * Populated by JwtStrategy.validate() which does a DB lookup on every
 * guarded request. The result is cached on the request object by Passport.
 *
 * Usage patterns:
 *
 *   // Full user object
 *   @Get('profile')
 *   @UseGuards(JwtAuthGuard)
 *   getProfile(@CurrentUser() user: AuthenticatedUser) { ... }
 *
 *   // Single field shortcut — avoids destructuring at call site
 *   @Post('bookings')
 *   createBooking(@CurrentUser('id') userId: string) { ... }
 *
 *   // Agency context — available for AGENCY_OWNER / AGENCY_STAFF only
 *   @Get('vehicles')
 *   listVehicles(@CurrentUser('agencyId') agencyId: string | null) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) return undefined;

    return field !== undefined ? user[field] : user;
  },
);
