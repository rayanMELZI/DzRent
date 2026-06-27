/**
 * ComplianceDot — a colored dot + label showing days until a document (insurance
 * or technical inspection) expires. Red ≤10 days, amber ≤30, green beyond. These
 * gate whether a vehicle may legally be rented in Algeria.
 */
import { status as statusTokens } from '@dzrent/tokens';

export function ComplianceDot({ days, label }: { days: number; label: string }) {
  const tone = days <= 10 ? statusTokens.refused : days <= 30 ? statusTokens.expiring : statusTokens.approved;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
      style={{ color: tone.ink }}
      title={`${label}: ${days}j`}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: tone.dot }} />
      {label} {days <= 30 ? `${days}j` : '✓'}
    </span>
  );
}
