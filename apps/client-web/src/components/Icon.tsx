/**
 * Minimal inline SVG icon set (1.7px stroke, round caps) matching the prototype's
 * hand-rolled glyphs. Swappable for Lucide/Phosphor later — they share the weight.
 */
import type { SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'fleet'
  | 'requests'
  | 'blacklist'
  | 'map'
  | 'revenue'
  | 'staff'
  | 'search'
  | 'bell'
  | 'check'
  | 'alert'
  | 'star'
  | 'chevron'
  | 'logout'
  | 'car'
  | 'plus'
  | 'x'
  | 'shield'
  | 'building'
  | 'gauge'
  | 'grid'
  | 'list'
  | 'calendar'
  | 'pin'
  | 'user'
  | 'doc'
  | 'upload'
  | 'clock'
  | 'seat'
  | 'gear'
  | 'fuel'
  | 'phone'
  | 'info'
  | 'refund'
  | 'lock'
  | 'trips';

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  fleet: (
    <>
      <path d="M3 13l2-5a2 2 0 012-1.5h10A2 2 0 0119 8l2 5" />
      <path d="M3 13h18v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
      <circle cx="7" cy="15.5" r="0.6" />
      <circle cx="17" cy="15.5" r="0.6" />
    </>
  ),
  requests: (
    <>
      <path d="M4 5h16v11H7l-3 3z" />
      <path d="M8 9h8M8 12h5" />
    </>
  ),
  blacklist: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  map: (
    <>
      <path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  revenue: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  staff: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0112 0" />
      <path d="M16 5.5a3 3 0 010 5.5M21 20a6 6 0 00-5-5.9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 19a2 2 0 004 0" />
    </>
  ),
  check: <path d="M5 12l4 4L19 6" />,
  alert: (
    <>
      <path d="M12 3l9 16H3z" />
      <path d="M12 10v4M12 17.5v.5" />
    </>
  ),
  star: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  logout: (
    <>
      <path d="M14 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4" />
      <path d="M10 8l-4 4 4 4M6 12h11" />
    </>
  ),
  car: (
    <path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11M5 11h14M5 11v5h14v-5M7.5 16v2M16.5 16v2M7 13.5h1.5M15.5 13.5H17" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  shield: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  building: (
    <path d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 21V9h4a1 1 0 011 1v11M8 8h3M8 12h3M8 16h3" />
  ),
  gauge: (
    <>
      <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" />
      <path d="M12 12l3-2M5 18a9 9 0 1114 0" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </>
  ),
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  seat: (
    <>
      <path d="M7 4h5a2 2 0 012 2v8H7z" />
      <path d="M5 14h12a2 2 0 012 2v2H5zM7 18v2M17 18v2" />
    </>
  ),
  gear: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M6 8v8M12 8v8M18 8v4H6" />
    </>
  ),
  fuel: (
    <>
      <path d="M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16M3 21h12M4 10h10" />
      <path d="M14 8l3 3v6a1.5 1.5 0 003 0V9l-3-3" />
    </>
  ),
  phone: (
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z" />
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
  refund: <path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 018 0v3.5" />
    </>
  ),
  trips: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  stroke?: string;
  sw?: number;
}

export function Icon({ name, size = 20, stroke = 'currentColor', sw = 1.7, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
