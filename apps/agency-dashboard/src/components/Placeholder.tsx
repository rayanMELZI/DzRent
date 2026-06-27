/**
 * Placeholder image — striped background + a mono label (e.g. `photo · Dacia Logan`).
 * The labeled empty-slot pattern stays until real photography is supplied
 * (design handoff §11).
 */
import type { CSSProperties } from 'react';

interface PlaceholderProps {
  label: string;
  height?: number;
  radius?: number;
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Placeholder({
  label,
  height = 160,
  radius = 12,
  dark = false,
  className = '',
  style,
}: PlaceholderProps) {
  const base = dark ? '#2A322E' : '#ECE7DC';
  const stripe = dark ? '#323B36' : '#E3DDCF';
  const ink = dark ? '#8A958D' : '#9AA09A';
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        height,
        borderRadius: radius,
        background: `repeating-linear-gradient(135deg, ${base} 0 11px, ${stripe} 11px 22px)`,
        ...style,
      }}
    >
      <span
        className="dz-mono rounded-md px-2.5 py-1 text-[11px]"
        style={{
          color: ink,
          background: dark ? 'rgba(20,24,22,.6)' : 'rgba(246,243,236,.78)',
          backdropFilter: 'blur(2px)',
        }}
      >
        {label}
      </span>
    </div>
  );
}
