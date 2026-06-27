import { UserRole } from '@prisma/client';

/**
 * Payload embedded in the short-lived ACCESS token (15 min).
 * Kept minimal — only what guards and decorators need per-request.
 * Never embed sensitive data (password hashes, OTP, etc.) in JWT payloads.
 */
export interface JwtPayload {
  /** User.id (UUID) */
  sub: string;
  phone: string;
  role: UserRole;
  locale: 'fr' | 'ar';
  /** Token type discriminator — prevents access tokens being used as refresh tokens */
  type: 'access';
}

/**
 * Payload embedded in the long-lived REFRESH token (7 days).
 * The `jti` (JWT ID) is stored as a hash in Redis so individual tokens can
 * be revoked without invalidating all sessions (e.g. on password change).
 */
export interface JwtRefreshPayload {
  sub: string;
  /** JWT ID — unique per issued refresh token; used as Redis revocation key */
  jti: string;
  type: 'refresh';
}

/**
 * Validated payload returned by JwtStrategy.validate() — attached to request.user.
 * Extends JwtPayload with decoded fields ready for the request lifecycle.
 */
export interface ValidatedJwtPayload extends JwtPayload {
  iat: number;
  exp: number;
}
