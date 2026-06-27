// ui.jsx — primitives: Icon, Button, Chip, StatusBadge, VerifiedBadge,
// Stars, Placeholder, PhoneFrame, BrowserFrame, Toast.

// ---------- Icons (functional line set) ----------
const ICONS = {
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  check: 'M5 12.5l4.5 4.5L19 7',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  car: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M5 11h14M5 11v5h14v-5M7.5 16v2M16.5 16v2M7 13.5h1.5M15.5 13.5H17',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
  pin: 'M12 21s-6.5-5.4-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21z M12 10.5a2 2 0 1 0 0-.01',
  shield: 'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z',
  camera: 'M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z M12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  upload: 'M12 16V4M7 9l5-5 5 5M5 20h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6',
  phone: 'M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  home: 'M4 11l8-7 8 7M6 10v9h12v-9',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  bolt: 'M13 3L5 13h6l-1 8 8-10h-6z',
  refresh: 'M20 11A8 8 0 1 0 18 16M20 5v6h-6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3.5 2',
  filter: 'M4 5h16l-6 7.5V19l-4 2v-8.5z',
  arrowReturn: 'M9 14l-4-4 4-4M5 10h9a5 5 0 0 1 0 10h-3',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  card: 'M3 7h18v10H3zM3 11h18',
  cash: 'M3 7h18v10H3z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z',
  sign: 'M4 19c4-1 5-9 7-9s2 5 4 5 2-3 5-3',
  fuel: 'M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h12M15 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8l-2.5-2.5',
  gauge: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M12 14l4-4M5 18a9 9 0 1 1 14 0',
  seat: 'M7 4h6a2 2 0 0 1 2 2v6H7zM7 12l-1 8M15 12l1 8M5 12h12',
  speed: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M12 12l3-2',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z M10 21h4',
  building: 'M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 21V9h4a1 1 0 0 1 1 1v11M8 8h3M8 12h3M8 16h3',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  trash: 'M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13',
};

function Icon({ name, size = 20, stroke = 'currentColor', sw = 1.7, fill = 'none', className = '', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={className} style={{ flexShrink: 0, display: 'block', ...style }}>
      <path d={ICONS[name] || ''} stroke={stroke} strokeWidth={sw}
        strokeLinecap="round" strokeLinejoin="round" fill={fill} />
    </svg>
  );
}

// ---------- Button ----------
function Button({ children, variant = 'primary', size = 'md', full, icon, iconRight, style, ...rest }) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13, minHeight: 38, gap: 7 },
    md: { padding: '12px 18px', fontSize: 15, minHeight: 48, gap: 9 },
    lg: { padding: '15px 22px', fontSize: 16, minHeight: 54, gap: 10 },
  }[size];
  const variants = {
    primary:  { background: T.primary, color: '#fff' },
    clay:     { background: T.clay, color: '#fff' },
    outline:  { background: 'transparent', color: T.primary, boxShadow: `inset 0 0 0 1.5px ${T.primary}` },
    ghost:    { background: 'transparent', color: T.ink2 },
    soft:     { background: T.primarySoft, color: T.primaryDeep },
    dark:     { background: T.ink, color: '#fff' },
    danger:   { background: T.status.refused.bg, color: T.status.refused.ink, boxShadow: `inset 0 0 0 1px ${T.status.refused.dot}33` },
    success:  { background: T.status.approved.bg, color: T.status.approved.ink, boxShadow: `inset 0 0 0 1px ${T.status.approved.dot}44` },
  }[variant];
  return (
    <button {...rest} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, fontWeight: 600, width: full ? '100%' : undefined,
      transition: 'transform .12s, filter .15s, box-shadow .15s', whiteSpace: 'nowrap',
      ...sizes, ...variants, ...style,
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(.975)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 19} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 19} className="dz-flip" />}
    </button>
  );
}

// ---------- Chip ----------
function Chip({ children, active, onClick, icon, style }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px',
      borderRadius: 999, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
      background: active ? T.primary : T.paper,
      color: active ? '#fff' : T.ink2,
      boxShadow: active ? 'none' : `inset 0 0 0 1px ${T.line2}`,
      transition: 'all .15s', ...style,
    }}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

// ---------- Status badge (shared vocabulary) ----------
const STATUS_KEY = {
  approved: 'st_approved', verified: 'st_verified', pending: 'st_pending',
  refused: 'st_refused', expiring: 'st_expiring', none: 'st_none', blacklist: 'st_blacklist',
};
function StatusBadge({ status, label, size = 'md', t }) {
  const s = T.status[status] || T.status.none;
  const txt = label || (t ? t(STATUS_KEY[status]) : status);
  const pad = size === 'sm' ? '3px 8px' : '5px 11px';
  const fs = size === 'sm' ? 11 : 12.5;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad,
      borderRadius: 999, fontSize: fs, fontWeight: 600, lineHeight: 1,
      color: s.ink, background: s.bg,
      boxShadow: status === 'expiring' ? `inset 0 0 0 1px ${s.border}` : 'none',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: s.dot, flexShrink: 0 }} />
      {txt}
    </span>
  );
}

// ---------- Verified badge (✓ in circle) ----------
function VerifiedBadge({ size = 18, title }) {
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 999, background: T.primary, flexShrink: 0,
    }}>
      <Icon name="check" size={size * 0.62} stroke="#fff" sw={2.6} />
    </span>
  );
}

// ---------- Stars ----------
function Stars({ value, size = 13, showNum }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon name="star" size={size} fill={T.clay} stroke={T.clay} sw={1} />
      <span className="dz-tnum" style={{ fontWeight: 600, fontSize: size + 1 }}>{value.toFixed(1)}</span>
    </span>
  );
}

// ---------- Placeholder image (striped + mono label) ----------
function Placeholder({ label, height = 160, radius = 12, style, dark }) {
  const base = dark ? '#2A322E' : '#ECE7DC';
  const stripe = dark ? '#323B36' : '#E3DDCF';
  const ink = dark ? '#8A958D' : '#9AA09A';
  return (
    <div style={{
      height, borderRadius: radius, position: 'relative', overflow: 'hidden',
      background: `repeating-linear-gradient(135deg, ${base} 0 11px, ${stripe} 11px 22px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      <span className="dz-mono" style={{
        fontSize: 11, color: ink, background: dark ? 'rgba(20,24,22,.6)' : 'rgba(246,243,236,.78)',
        padding: '4px 9px', borderRadius: 6, letterSpacing: '.01em', backdropFilter: 'blur(2px)',
      }}>{label}</span>
    </div>
  );
}

// ---------- Toast ----------
function Toast({ toast }) {
  if (!toast) return null;
  const tone = toast.tone === 'err'
    ? { bg: T.status.refused.ink, } : { bg: T.primary };
  return (
    <div className="dz-pop" style={{
      position: 'absolute', bottom: 84, left: '50%', transform: 'translateX(-50%)',
      background: tone.bg, color: '#fff', padding: '11px 18px', borderRadius: 12,
      fontSize: 14, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,.22)', zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap',
    }}>
      <Icon name={toast.tone === 'err' ? 'alert' : 'check'} size={17} stroke="#fff" sw={2.4} />
      {toast.msg}
    </div>
  );
}

// ---------- Phone frame (Android mid-range, ~360px screen) ----------
function PhoneFrame({ children, statusDark = true, label }) {
  const { lang } = useLang();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {label && <div className="dz-label" style={{ color: T.ink4 }}>{label}</div>}
      <div style={{
        width: 392, padding: 13, borderRadius: 46, background: 'linear-gradient(150deg,#1b211e,#10140f)',
        boxShadow: '0 2px 4px rgba(0,0,0,.3), 0 30px 70px -20px rgba(29,36,33,.55), inset 0 0 0 1.5px #2c332e',
      }}>
        <div style={{
          width: 366, height: 770, borderRadius: 34, overflow: 'hidden', position: 'relative',
          background: T.sand, display: 'flex', flexDirection: 'column',
        }}>
          {/* status bar */}
          <div style={{
            height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', fontSize: 12.5, fontWeight: 600,
            color: statusDark ? T.ink : '#fff', background: 'transparent', zIndex: 30,
            position: 'relative',
          }}>
            <span className="dz-tnum">{lang === 'ar' ? '٩:٤١' : '9:41'}</span>
            <div style={{
              position: 'absolute', left: '50%', top: 9, transform: 'translateX(-50%)',
              width: 78, height: 18, borderRadius: 999, background: '#10140f',
            }} />
            <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <Icon name="bolt" size={13} fill={statusDark ? T.ink : '#fff'} stroke="none" />
              <span style={{
                width: 22, height: 11, borderRadius: 3, border: `1.4px solid ${statusDark ? T.ink : '#fff'}`,
                position: 'relative', display: 'inline-block',
              }}>
                <span style={{ position: 'absolute', inset: 1.5, width: '72%', background: statusDark ? T.ink : '#fff', borderRadius: 1 }} />
              </span>
            </span>
          </div>
          {/* screen content */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Browser frame (desktop dashboard chrome) ----------
function BrowserFrame({ children, url = 'app.dzrent.dz', width = 1180, height = 800, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {label && <div className="dz-label" style={{ color: T.ink4 }}>{label}</div>}
      <div style={{
        width, borderRadius: 16, overflow: 'hidden', background: '#fff',
        boxShadow: '0 2px 6px rgba(29,36,33,.08), 0 40px 90px -30px rgba(29,36,33,.45)',
        border: `1px solid ${T.line2}`,
      }}>
        <div style={{
          height: 46, background: '#EDEAE1', display: 'flex', alignItems: 'center',
          gap: 14, padding: '0 16px', borderBottom: `1px solid ${T.line2}`,
        }} dir="ltr">
          <div style={{ display: 'flex', gap: 8 }}>
            {['#E5675B', '#E5B23F', '#5FB85B'].map(c =>
              <span key={c} style={{ width: 12, height: 12, borderRadius: 999, background: c }} />)}
          </div>
          <div style={{
            flex: 1, maxWidth: 380, height: 28, borderRadius: 8, background: '#F6F3EC',
            display: 'flex', alignItems: 'center', gap: 7, padding: '0 12px',
            fontSize: 12.5, color: T.ink3, margin: '0 auto',
          }}>
            <Icon name="lock" size={12} stroke={T.ink4} />
            <span className="dz-mono" style={{ fontSize: 11.5 }}>{url}</span>
          </div>
          <div style={{ width: 56 }} />
        </div>
        <div style={{ height: height - 46, overflow: 'hidden', display: 'flex' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, ICONS, Button, Chip, StatusBadge, VerifiedBadge, Stars,
  Placeholder, Toast, PhoneFrame, BrowserFrame,
});
