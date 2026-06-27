/**
 * The one shared status badge reused across KYC docs, vehicle papers, bookings
 * and fraud (design handoff §3.5 / §6.4). Pill, 7px dot, weight 600. Never
 * invent per-feature status styles — extend the vocabulary here instead.
 */
import { status as statusTokens, type StatusToken } from '@dzrent/tokens';

interface StatusBadgeProps {
  status: StatusToken;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const s = statusTokens[status];
  const border = 'border' in s ? s.border : 'transparent';
  return (
    <span
      className="dz-label inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ color: s.ink, background: s.bg, border: `1px solid ${border}` }}
    >
      <span
        className="inline-block h-[7px] w-[7px] rounded-full"
        style={{ background: s.dot }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
