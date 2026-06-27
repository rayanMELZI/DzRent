/**
 * DzRent design tokens.
 *
 * Single source of truth for color, status vocabulary, typography, radii, shadows
 * and motion. Ported verbatim from the design handoff (`tokens.jsx`) so the
 * production UI matches the approved hi-fi prototype pixel-for-pixel.
 *
 * Hard rules these tokens encode (see design handoff §3 / §6):
 *  - The "Sahel" palette: deep green-teal trust color on warm sand.
 *  - The refundable deposit is visually quarantined (cold blue-slate, dashed).
 *  - One shared status vocabulary reused across KYC, vehicles, bookings, fraud.
 */

export const colors = {
  // Brand
  primary: '#0F5249', // trust green-teal — primary actions, sidebar, total banner
  primaryDeep: '#0B3F38', // pressed / dark green
  primarySoft: '#E2ECEA', // soft green chips / fills
  clay: '#C0613A', // terracotta accent — secondary CTAs, "new" tags
  claySoft: '#F2E1D8', // soft clay fill

  // Surfaces
  sand: '#F6F3EC', // screen background
  canvas: '#E7E4DD', // warm-gray canvas / showcase background
  paper: '#FFFFFF', // cards

  // Text
  ink: '#1D2421',
  ink2: '#4A5048',
  ink3: '#6B7069',
  ink4: '#8A8F88',
  ink5: '#9AA09A',

  // Borders
  line: '#E6E1D6',
  line2: '#DDD7CA',
  line3: '#EFECE0',

  // Money / deposit quarantine
  depositBg: '#F1F5F6', // cold blue-slate fill
  depositInk: '#33505C',
  depositLine: '#7D97A3', // dashed border
} as const;

/**
 * Shared status vocabulary. Each entry is `{ ink, bg, dot }` (plus `border` for
 * `expiring`). Reused EVERYWHERE — never invent per-feature status styles.
 */
export const status = {
  approved: { ink: '#1F6B41', bg: '#E4F3EA', dot: '#2F8F5B' },
  pending: { ink: '#8A5A12', bg: '#FBEED3', dot: '#D99316' },
  refused: { ink: '#9C352B', bg: '#F8E3E1', dot: '#C0392B' },
  expiring: { ink: '#9A6516', bg: '#FFFFFF', dot: '#E0A94E', border: '#E0A94E' },
  none: { ink: '#6B7069', bg: '#EEECE5', dot: '#9AA09A' },
  blacklist: { ink: '#7A1F17', bg: '#F4D3CE', dot: '#7A1F17' },
} as const;

export type StatusToken = keyof typeof status;

export const fonts = {
  sans: "'IBM Plex Sans','IBM Plex Sans Arabic',system-ui,sans-serif",
  arabic: "'IBM Plex Sans Arabic','IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',ui-monospace,monospace",
} as const;

/** Type scale (class → size / weight). Mirrors the `.dz-*` utilities. */
export const typeScale = {
  display: { size: '38px', weight: 700, tracking: '-0.02em', lineHeight: 1.05 },
  h1: { size: '24px', weight: 600, tracking: '-0.01em', lineHeight: 1.15 },
  h2: { size: '19px', weight: 600, tracking: '-0.01em', lineHeight: 1.2 },
  h3: { size: '16px', weight: 600, lineHeight: 1.25 },
  body: { size: '15px', weight: 400, lineHeight: 1.5 },
  sm: { size: '13px', weight: 400, lineHeight: 1.45 },
  xs: { size: '11.5px', weight: 400, lineHeight: 1.4 },
  label: { size: '11px', weight: 600, tracking: '0.04em', lineHeight: 1 },
} as const;

export const radii = {
  r1: '8px',
  r2: '12px',
  r3: '16px',
  r4: '22px',
} as const;

export const shadows = {
  shadow: '0 1px 2px rgba(29,36,33,.04), 0 6px 20px rgba(29,36,33,.06)',
  shadowUp: '0 -2px 16px rgba(29,36,33,.08)', // bottom sticky bars
  shadowCard: '0 1px 3px rgba(29,36,33,.05), 0 10px 30px rgba(29,36,33,.08)',
} as const;

/** Google Fonts URL for the IBM Plex superfamily (self-host for the PWA). */
export const fontImportUrl =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap';

/** Flat token object, kept for parity with the prototype's `T`. */
export const tokens = {
  colors,
  status,
  fonts,
  typeScale,
  radii,
  shadows,
} as const;

export default tokens;
