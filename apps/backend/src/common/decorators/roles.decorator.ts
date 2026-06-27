import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'dzrent_roles';

/**
 * @Roles(...UserRole) — declares which Prisma UserRole values may access a route.
 *
 * Must be paired with @UseGuards(JwtAuthGuard, RolesGuard).
 * ADMIN always passes — RolesGuard grants platform superusers implicit access.
 *
 * Usage:
 *   @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Get('fleet')
 *   listFleet() { ... }
 *
 * Controller-level roles set a default for all routes in the controller.
 * Handler-level @Roles() overrides the controller default for that route.
 */
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
