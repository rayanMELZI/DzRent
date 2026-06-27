import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { FullDbUser } from '../interceptors/full-user.interceptor';

/**
 * @CurrentDbUser() — extracts the full Prisma User record from `request.dbUser`.
 *
 * REQUIRES `FullUserInterceptor` to run on the same route BEFORE this decorator
 * is evaluated. The interceptor performs the DB lookup and populates request.dbUser.
 *
 * Returns `undefined` if FullUserInterceptor did not run (interceptors are opt-in).
 * Design-time TypeScript will catch misuse in strongly-typed handlers.
 *
 * ── Comparison: @CurrentUser() vs @CurrentDbUser() ───────────────────────────
 *
 *   @CurrentUser()    — reads from request.user (JWT payload enriched by JwtStrategy)
 *                       No extra DB call. Available on ALL guarded routes.
 *                       Contains: id, phone, email, firstName, lastName, role,
 *                                 status, locale, agencyId, riskScore.
 *                       Use for: auth checks, RBAC, agency context.
 *
 *   @CurrentDbUser()  — reads from request.dbUser (set by FullUserInterceptor)
 *                       Requires an explicit DB fetch per request.
 *                       Contains everything above PLUS: nationalIdNumber,
 *                                 kycDocuments[], lastLoginAt, createdAt.
 *                       Use for: profile endpoints, KYC checks, booking gates.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *
 *   @Get('me')
 *   @UseGuards(JwtAuthGuard)
 *   @UseInterceptors(FullUserInterceptor)
 *   async getProfile(@CurrentDbUser() user: FullDbUser) {
 *     return { kycDocuments: user.kycDocuments };
 *   }
 *
 *   // Field shortcut
 *   @CurrentDbUser('nationalIdNumber') cin: string | null
 */
export const CurrentDbUser = createParamDecorator(
  (field: keyof FullDbUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { dbUser?: FullDbUser }>();
    const dbUser = request.dbUser;
    if (!dbUser) return undefined;
    return field !== undefined ? dbUser[field] : dbUser;
  },
);
