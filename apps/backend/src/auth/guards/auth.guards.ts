import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { populateAgencyContext } from '../../common/context/agency-context.store';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * JwtAuthGuard — validates the ACCESS token, then populates the per-request
 * agency context (AUDIT FIX B3: guards are the earliest point where
 * req.user exists; middleware runs too early).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ok = (await super.canActivate(context)) as boolean;
    if (ok) {
      const req = context.switchToHttp().getRequest<Request>();
      const user = req.user as AuthenticatedUser | undefined;
      if (user) populateAgencyContext(user.id, user.agencyId);
    }
    return ok;
  }
}

/** Validates the long-lived REFRESH token (rotation endpoint + logout). */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
