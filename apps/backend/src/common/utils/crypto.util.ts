import { createHash, createHmac, timingSafeEqual } from 'crypto';

/**
 * AUDIT FIX B2 — bcrypt silently truncates input at 72 BYTES.
 * A JWT is far longer than 72 bytes, and the first 72 bytes of every refresh
 * token for the same user are identical (fixed header + start of payload
 * containing `sub`). bcrypt-hashing refresh tokens therefore produced the
 * SAME hash for ALL of a user's tokens — the "hash mismatch = theft" check
 * was dead code. Refresh tokens carry 256 bits of HMAC entropy, so a fast
 * SHA-256 + constant-time compare is both correct and sufficient.
 * (bcrypt remains correct for the 6-digit OTP — low entropy needs slow hashing.)
 */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function safeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}
