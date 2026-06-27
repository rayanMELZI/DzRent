// tokens.jsx — DzRent design system: color, status, type, spacing.
// Injects a global stylesheet (CSS vars + base + logical-property utilities)
// and exports a JS `T` token object for inline use.
// Loaded first, before any component file.

const T = {
  // brand
  primary: '#0F5249',      // trust green-teal
  primaryDeep: '#0B3F38',
  primarySoft: '#E2ECEA',
  clay: '#C0613A',         // terracotta accent
  claySoft: '#F2E1D8',
  // surfaces
  sand: '#F6F3EC',         // screen background
  canvas: '#E7E4DD',       // warm gray canvas / showcase
  paper: '#FFFFFF',
  // text
  ink: '#1D2421',
  ink2: '#4A5048',
  ink3: '#6B7069',
  ink4: '#8A8F88',
  ink5: '#9AA09A',
  // borders
  line: '#E6E1D6',
  line2: '#DDD7CA',
  line3: '#EFECE0',
  // money / deposit
  depositBg: '#F1F5F6',
  depositInk: '#33505C',
  depositLine: '#7D97A3',
  // status palette
  status: {
    approved: { ink: '#1F6B41', bg: '#E4F3EA', dot: '#2F8F5B' },
    pending:  { ink: '#8A5A12', bg: '#FBEED3', dot: '#D99316' },
    refused:  { ink: '#9C352B', bg: '#F8E3E1', dot: '#C0392B' },
    expiring: { ink: '#9A6516', bg: '#FFFFFF', dot: '#E0A94E', border: '#E0A94E' },
    none:     { ink: '#6B7069', bg: '#EEECE5', dot: '#9AA09A' },
    blacklist:{ ink: '#7A1F17', bg: '#F4D3CE', dot: '#7A1F17' },
  },
  // fonts
  sans: "'IBM Plex Sans','IBM Plex Sans Arabic',system-ui,sans-serif",
  arabic: "'IBM Plex Sans Arabic','IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',ui-monospace,monospace",
  // radii
  r1: '8px', r2: '12px', r3: '16px', r4: '22px',
  // shadow
  shadow: '0 1px 2px rgba(29,36,33,.04), 0 6px 20px rgba(29,36,33,.06)',
  shadowUp: '0 -2px 16px rgba(29,36,33,.08)',
  shadowCard: '0 1px 3px rgba(29,36,33,.05), 0 10px 30px rgba(29,36,33,.08)',
};

const _dzStyle = document.createElement('style');
_dzStyle.id = 'dz-tokens';
_dzStyle.textContent = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: ${T.sans};
  color: ${T.ink};
  background: ${T.canvas};
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
[dir="rtl"] { font-family: ${T.arabic}; }
button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
input, textarea, select { font-family: inherit; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: ${T.line2}; border-radius: 8px; }
::-webkit-scrollbar-track { background: transparent; }

/* chevrons / directional glyphs flip in RTL */
[dir="rtl"] .dz-flip { transform: scaleX(-1); }

.dz-mono { font-family: ${T.mono}; font-feature-settings: "tnum" 1; letter-spacing: -.01em; }
.dz-tnum { font-variant-numeric: tabular-nums; }

/* type scale */
.dz-display { font-size: 38px; line-height: 1.05; font-weight: 700; letter-spacing: -.02em; }
.dz-h1 { font-size: 24px; line-height: 1.15; font-weight: 600; letter-spacing: -.01em; }
.dz-h2 { font-size: 19px; line-height: 1.2; font-weight: 600; letter-spacing: -.01em; }
.dz-h3 { font-size: 16px; line-height: 1.25; font-weight: 600; }
.dz-body { font-size: 15px; line-height: 1.5; font-weight: 400; }
.dz-sm { font-size: 13px; line-height: 1.45; }
.dz-xs { font-size: 11.5px; line-height: 1.4; }
.dz-label { font-size: 11px; line-height: 1; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }

/* focus */
:focus-visible { outline: 2px solid ${T.primary}; outline-offset: 2px; }

/* entrance helpers — opacity-free so content is never hidden when frozen/printed/reduced-motion */
@keyframes dzFadeUp { from { transform: translateY(9px); } to { transform: none; } }
.dz-enter { animation: dzFadeUp .34s cubic-bezier(.22,.61,.36,1) both; }
@keyframes dzScaleIn { from { transform: scale(.975); } to { transform: none; } }
.dz-pop { animation: dzScaleIn .24s cubic-bezier(.22,.61,.36,1) both; }
@keyframes dzPulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
.dz-pulse { animation: dzPulse 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .dz-enter, .dz-pop, .dz-pulse { animation: none; } }
`;
document.head.appendChild(_dzStyle);

window.T = T;
