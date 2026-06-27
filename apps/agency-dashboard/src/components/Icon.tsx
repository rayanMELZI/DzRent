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
  | 'logout';

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
