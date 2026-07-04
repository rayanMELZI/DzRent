/**
 * Locale-aware date display for API data (ISO strings → FR/AR text).
 * The backend sends UTC ISO timestamps; every human-facing rendering
 * happens here so the two languages stay consistent across screens.
 */
import type { Lang } from '@dzrent/i18n';

const LOCALES: Record<Lang, string> = { fr: 'fr', ar: 'ar' };

/** "il y a 22 min" / "منذ ٢٢ دقيقة" — coarse relative time for queue rows. */
export function relativeFromNow(iso: string, lang: Lang): string {
  const rtf = new Intl.RelativeTimeFormat(LOCALES[lang], { numeric: 'auto' });
  const deltaMs = new Date(iso).getTime() - Date.now();
  const minutes = Math.round(deltaMs / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, 'day');
  const months = Math.round(days / 30);
  return rtf.format(months, 'month');
}

/** "28 juin" / "٢٨ جوان" — rental period bounds. */
export function dayMonth(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short' }).format(
    new Date(iso),
  );
}

/** "avr. 2026" — member-since line. */
export function monthYear(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}
