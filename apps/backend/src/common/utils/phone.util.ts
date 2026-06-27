/**
 * DzRent — Phone Number Utilities
 *
 * All phone numbers on the platform are stored in E.164 format: +213XXXXXXXXX
 * These helpers centralise formatting/validation so the rule is never duplicated.
 *
 * Algerian mobile number system:
 *   - Country code: +213
 *   - Mobilis  prefix: 05xx → E.164: +2135xx
 *   - Djezzy   prefix: 06xx → E.164: +2136xx
 *   - Ooredoo  prefix: 07xx → E.164: +2137xx
 *
 * Fixed-line numbers (02x, 03x, 04x) are also valid and supported.
 */

/** Regex for Algerian mobile numbers already in E.164 format */
const DZ_E164_REGEX = /^\+213[5-7]\d{8}$/;

/** Broad E.164 regex (all countries) — used for non-Algerian users (diaspora, admin) */
const GLOBAL_E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Normalises a raw phone string to E.164 format.
 * Handles the common Algerian input patterns:
 *   "0551234567"   → "+213551234567"
 *   "+213551234567" → "+213551234567" (no-op)
 *   "00213551234567" → "+213551234567"
 *
 * Returns null if the input cannot be normalised to a valid E.164 number.
 */
export function normaliseAlgerianPhone(raw: string): string | null {
  if (!raw) return null;

  // Strip all whitespace and dashes
  const cleaned = raw.replace(/[\s\-().]/g, '');

  // Already correct E.164 — validate and return
  if (cleaned.startsWith('+213')) {
    return GLOBAL_E164_REGEX.test(cleaned) ? cleaned : null;
  }

  // International prefix without +
  if (cleaned.startsWith('00213')) {
    const candidate = '+' + cleaned.slice(2);
    return GLOBAL_E164_REGEX.test(candidate) ? candidate : null;
  }

  // Local Algerian format (0XXXXXXXXX → 9 or 10 digits after leading 0)
  if (cleaned.startsWith('0') && cleaned.length >= 9) {
    const candidate = '+213' + cleaned.slice(1);
    return GLOBAL_E164_REGEX.test(candidate) ? candidate : null;
  }

  return null;
}

/**
 * Returns true if `phone` is a valid Algerian mobile number in E.164.
 * Used in DTO validators via @IsAlgerianPhone() decorator.
 */
export function isAlgerianMobilePhone(phone: string): boolean {
  return DZ_E164_REGEX.test(phone);
}

/**
 * Returns true if `phone` is ANY valid E.164 number (global).
 * Used for non-mandatory phone fields (e.g. agency landline).
 */
export function isE164Phone(phone: string): boolean {
  return GLOBAL_E164_REGEX.test(phone);
}

/**
 * Formats an E.164 number for display in the Algerian locale.
 * "+213551234567" → "0551 23 45 67"
 */
export function formatAlgerianPhoneDisplay(e164: string): string {
  if (!e164.startsWith('+213')) return e164;
  const local = '0' + e164.slice(4); // strip +213, prepend 0
  // Groups: 4 + 2 + 2 + 2
  return local.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4');
}
