/**
 * DzRent — Date & Timezone Utilities
 *
 * Database rule (from Sprint 1): ALL DateTime fields use @db.Timestamptz(0)
 * meaning they are stored in UTC. Display is always Africa/Algiers (UTC+1, no DST).
 *
 * Algeria uses CET year-round (no daylight saving time since 1981).
 * UTC offset is always +01:00 — no need for DST-aware library calls.
 *
 * These utilities live in the util layer, not in a controller, so they can be
 * used in services, PDF generators, SMS messages, and audit logs consistently.
 */

/** IANA timezone identifier for Algeria */
export const ALGERIA_TZ = 'Africa/Algiers';

/** UTC offset in milliseconds (always +1h, no DST) */
const ALGERIA_OFFSET_MS = 60 * 60 * 1000;

/**
 * Converts a UTC Date to the Africa/Algiers local time.
 * Returns a NEW Date object whose getHours() / getMinutes() etc.
 * reflect the Algiers clock time (note: Date is still internally UTC).
 *
 * Use this ONLY for formatting/display — never for DB writes.
 */
export function toAlgiersTime(utcDate: Date): Date {
  return new Date(utcDate.getTime() + ALGERIA_OFFSET_MS);
}

/**
 * Formats a UTC date as a human-readable Algerian date string.
 * Output example: "lundi 15 janvier 2024, 10:30"
 *
 * @param utcDate  The UTC date from the database
 * @param locale   'fr' (default) | 'ar'
 * @param includeTime  Whether to append time (default: true)
 */
export function formatAlgiersDate(
  utcDate: Date,
  locale: 'fr' | 'ar' = 'fr',
  includeTime = true,
): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    timeZone: ALGERIA_TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(utcDate);
}

/**
 * Returns the current UTC time.
 * Always use this instead of `new Date()` in services so tests can mock it.
 */
export function nowUtc(): Date {
  return new Date();
}

/**
 * Adds `minutes` to a UTC date. Used for OTP expiry calculation.
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/**
 * Returns true if `date` is in the past relative to now (UTC).
 */
export function isExpired(date: Date): boolean {
  return date < nowUtc();
}

/**
 * Computes the number of full rental days between two UTC dates.
 * Uses ceiling — a 25-hour rental counts as 2 days (standard Algerian practice).
 */
export function rentalDays(from: Date, until: Date): number {
  const diffMs = until.getTime() - from.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
