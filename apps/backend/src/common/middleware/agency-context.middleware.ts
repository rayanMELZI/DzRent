import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { agencyContextStore, AgencyContext } from '../context/agency-context.store';

/**
 * Establishes an empty ALS store for every request. Population happens later
 * in JwtAuthGuard (guards run after middleware — see agency-context.store.ts,
 * AUDIT FIX B3). Unauthenticated routes keep the empty context.
 */
@Injectable()
export class AgencyContextMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction): void {
    const context: AgencyContext = { userId: null, agencyId: null };
    agencyContextStore.run(context, () => next());
  }
}
