/**
 * Search state lives in the URL (`?wilaya=16&from=2026-11-10&to=2026-11-13&cat=suv`)
 * so results, agency pages and car pages are shareable and survive a refresh.
 * Dates are calendar days; pickup/return are at 10:00 local time.
 */
import type { Lang } from '@dzrent/i18n';

export interface SearchState {
  wilaya: number | null;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  cat: string;
  model: string;
}

const PICKUP_HOUR = 10;

export function dayString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + n);
  return dayString(d);
}

export function today(): string {
  return dayString(new Date());
}

/** Calendar day → ISO instant at the standard pickup hour (local time). */
export function toIso(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  d.setHours(PICKUP_HOUR, 0, 0, 0);
  return d.toISOString();
}

export function defaultSearch(): SearchState {
  const from = addDays(today(), 1);
  return { wilaya: null, from, to: addDays(from, 3), cat: '', model: '' };
}

export function readSearch(params: URLSearchParams): SearchState {
  const d = defaultSearch();
  const w = Number(params.get('wilaya'));
  const from = params.get('from') ?? d.from;
  let to = params.get('to') ?? addDays(from, 3);
  if (to <= from) to = addDays(from, 1);
  return {
    wilaya: Number.isInteger(w) && w >= 1 && w <= 58 ? w : null,
    from,
    to,
    cat: params.get('cat') ?? '',
    model: params.get('model') ?? '',
  };
}

export function searchQuery(s: Partial<SearchState>): string {
  const p = new URLSearchParams();
  if (s.wilaya) p.set('wilaya', String(s.wilaya));
  if (s.from) p.set('from', s.from);
  if (s.to) p.set('to', s.to);
  if (s.cat) p.set('cat', s.cat);
  if (s.model) p.set('model', s.model);
  const q = p.toString();
  return q ? `?${q}` : '';
}

export function daysBetween(from: string, to: string): number {
  const ms = new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

export function formatDay(value: string | Date, lang: Lang, withYear = false): string {
  const d =
    typeof value === 'string' && value.length === 10
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(withYear && { year: 'numeric' }),
  }).format(d);
}

export const REGION_LABEL: Record<string, { fr: string; ar: string }> = {
  NORD_CENTRE: { fr: 'Nord Centre', ar: 'الشمال الأوسط' },
  NORD_EST: { fr: 'Nord Est', ar: 'الشمال الشرقي' },
  NORD_OUEST: { fr: 'Nord Ouest', ar: 'الشمال الغربي' },
  HAUTS_PLATEAUX: { fr: 'Hauts Plateaux', ar: 'الهضاب العليا' },
  GRAND_SUD: { fr: 'Grand Sud', ar: 'الجنوب الكبير' },
};

export const REGION_ORDER = [
  'NORD_CENTRE',
  'NORD_EST',
  'NORD_OUEST',
  'HAUTS_PLATEAUX',
  'GRAND_SUD',
];
