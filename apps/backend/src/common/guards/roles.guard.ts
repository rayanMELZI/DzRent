import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * RolesGuard — enforces the @Roles(...UserRole) decorator.
 *
 * ALWAYS pair with JwtAuthGuard, which must run FIRST to populate request.user:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *
 * Guard evaluation order in NestJS is left-to-right, so JwtAuthGuard
 * authenticates the user before RolesGuard checks their role.
 *
 * Role hierarchy (no implicit inheritance — all explicit):
 *   CLIENT        → own data only
 *   AGENCY_STAFF  → agency-scoped data (their agencyId only)
 *   AGENCY_OWNER  → full agency control
 *   ADMIN         → platform-wide — ADMIN implicitly passes ALL @Roles() checks
 *
 * Examples:
 *   @Roles(UserRole.AGENCY_OWNER, UserRole.ADMIN)
 *   → CLIENT and AGENCY_STAFF are rejected
 *
 *   @Roles(UserRole.AGENCY_STAFF, UserRole.AGENCY_OWNER, UserRole.ADMIN)
 *   → Only CLIENT is rejected (use for any agency-level action)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Merge handler-level + controller-level @Roles() (handler takes precedence)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator on this route → guard is a no-op
    // (JwtAuthGuard already ensures the user is authenticated)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    // Should never happen if JwtAuthGuard ran first — defensive check
    if (!user) {
      throw new UnauthorizedException('Authentication is required to access this resource.');
    }

    // ADMIN bypasses ALL role checks — platform superuser
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. This action requires one of the following roles: ` +
          `${requiredRoles.join(', ')}. Your role: ${user.role}.`,
      );
    }

    return true;
  }
}
