/**
 * DzRent i18n core — language model, RTL direction, DZD formatting and a tiny
 * framework-agnostic translator. UI frameworks wrap this in their own provider.
 */
import { STR, type StringKey, type LocalizedString } from './strings';

export { STR };
export type { StringKey, LocalizedString };

/** Supported UI languages. French is primary (LTR); Arabic is a true RTL mirror. */
export type Lang = 'fr' | 'ar';
export type Dir = 'ltr' | 'rtl';

export const LANGS: readonly Lang[] = ['fr', 'ar'] as const;
export const DEFAULT_LANG: Lang = 'fr';

/** Writing direction for a language. Arabic flips the entire layout (logical props). */
export function dirOf(lang: Lang): Dir {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * DZD formatter — space thousands separator via `fr-FR` locale.
 * e.g. `formatDZD(25000)` → `"25 000"`. Always pair with the `DZD` / `دج` unit.
 */
export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount));
}

/** Resolve a single key for a language, falling back to the key itself. */
export function translate(lang: Lang, key: StringKey): string {
  const entry: LocalizedString | undefined = STR[key];
  return entry ? entry[lang] : (key as string);
}

/** Build a bound translator: `const t = createTranslator('fr'); t('otp_title')`. */
export function createTranslator(lang: Lang) {
  return (key: StringKey): string => translate(lang, key);
}
