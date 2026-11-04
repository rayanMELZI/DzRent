'use client';

/**
 * Money widgets (design handoff §3.3). Amounts are always DZD with fr-FR spacing.
 * The refundable DEPOSIT is visually quarantined — dashed cold border, ↩ glyph,
 * "Remboursable" tag — and is NEVER summed into or styled like the spent total.
 */
import { formatDZD } from '@dzrent/i18n';
import { useLang } from '@/lib/i18n';
import { Icon } from './Icon';

export function Dzd({ amount, className = '' }: { amount: number; className?: string }) {
  const { t } = useLang();
  return (
    <span className={`dz-tnum whitespace-nowrap ${className}`}>
      {formatDZD(amount)} {t('common_dzd')}
    </span>
  );
}

export interface BreakdownLine {
  label: string;
  amount: number;
  muted?: boolean;
}

export function PriceBreakdown({ lines, total }: { lines: BreakdownLine[]; total: number }) {
  const { t } = useLang();
  return (
    <div>
      <div className="rounded-r2 bg-paper p-4 shadow-[inset_0_0_0_1px_#E6E1D6]">
        <div className="flex flex-col gap-2.5">
          {lines.map((l) => (
            <div key={l.label} className="dz-sm flex items-baseline justify-between gap-3">
              <span className={l.muted ? 'text-ink-4' : 'text-ink-2'}>{l.label}</span>
              <Dzd amount={l.amount} className="dz-mono text-ink" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between rounded-r2 bg-primary px-4 py-3.5 text-white">
        <span className="font-semibold">{t('co_total')}</span>
        <Dzd amount={total} className="dz-mono text-lg font-bold" />
      </div>
    </div>
  );
}

export function DepositBox({ amount, compact = false }: { amount: number; compact?: boolean }) {
  const { t } = useLang();
  return (
    <div
      className="rounded-r2 border-[1.5px] border-dashed border-deposit-line bg-deposit-bg px-4 py-3 text-deposit-ink"
      role="note"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name="refund" size={18} className="dz-flip shrink-0" />
          <span className="whitespace-nowrap font-semibold">{t('co_deposit')}</span>
        </div>
        <Dzd amount={amount} className="dz-mono font-semibold" />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="dz-label rounded-full bg-white/70 px-2 py-0.5">{t('co_deposit_tag')}</span>
        {!compact && <span className="dz-xs opacity-90">{t('co_deposit_note')}</span>}
      </div>
    </div>
  );
}
