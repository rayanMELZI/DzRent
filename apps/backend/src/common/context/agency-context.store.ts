import { AsyncLocalStorage } from 'async_hooks';

/**
 * Per-request agency context (AsyncLocalStorage).
 *
 * AUDIT FIX B3 — the original design read `req.user` inside an Express
 * middleware. In NestJS, MIDDLEWARE RUNS BEFORE GUARDS, and Passport only
 * populates req.user inside JwtAuthGuard. The context was therefore always
 * `{ agencyId: null }` — silently broken.
 *
 * Corrected flow:
 *   1. AgencyContextMiddleware creates an EMPTY store and wraps next() in it.
 *   2. JwtAuthGuard, after super.canActivate() succeeds, MUTATES the store
 *      with the authenticated user's id + agencyId (by-reference mutation is
 *      the standard ALS pattern for late population).
 *   3. Services / Prisma middleware read getCurrentAgencyContext() anywhere
 *      in the request's async chain.
 */
export interface AgencyContext {
  userId: string | null;
  /** Agency scope for AGENCY_OWNER / AGENCY_STAFF; null for CLIENT / ADMIN. */
  agencyId: string | null;
}

export const agencyContextStore = new AsyncLocalStorage<AgencyContext>();

export function getCurrentAgencyContext(): AgencyContext | null {
  return agencyContextStore.getStore() ?? null;
}

/** Called by JwtAuthGuard once Passport has authenticated the request. */
export function populateAgencyContext(userId: string, agencyId: string | null): void {
  const store = agencyContextStore.getStore();
  if (store) {
    store.userId = userId;
    store.agencyId = agencyId;
  }
}
