'use client';

/**
 * Requests queue — the heart of agency trust (design handoff §9.B.3).
 * Left: status tabs + request list. Right: the review/approve panel.
 */
import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { carById } from '@/lib/seed';
import type { RequestStatus } from '@dzrent/types';
import type { StringKey } from '@dzrent/i18n';
import { Icon } from '@/components/Icon';
import { RequestDetail } from './RequestDetail';

const TABS: { id: RequestStatus; key: StringKey }[] = [
  { id: 'pending', key: 'req_pending' },
  { id: 'approved', key: 'req_approved' },
  { id: 'refused', key: 'req_refused' },
];

export default function RequestsQueue() {
  const { t, lang } = useLang();
  const { requests } = useStore();
  const [tab, setTab] = useState<RequestStatus>('pending');
  const [selId, setSelId] = useState<string | null>(null);

  const filtered = useMemo(() => requests.filter((r) => r.status === tab), [requests, tab]);
  const selected = filtered.find((r) => r.id === selId) ?? filtered[0] ?? null;

  // Keep a valid selection when the tab changes.
  useEffect(() => {
    setSelId(filtered[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 gap-5">
      {/* list */}
      <div className="flex w-[380px] shrink-0 flex-col">
        <div className="mb-3.5 flex gap-1.5 rounded-r2 bg-paper p-1 shadow-[inset_0_0_0_1px_#DDD7CA]">
          {TABS.map((tb) => {
            const n = requests.filter((r) => r.status === tb.id).length;
            const on = tab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-[8px] px-1 py-2 text-[12.5px] font-semibold transition-colors ${
                  on ? 'bg-primary text-white' : 'text-ink-3 hover:text-ink'
                }`}
              >
                {t(tb.key)}
                {n > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-white/20' : 'bg-sand'}`}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pe-1">
          {filtered.map((r) => {
            const car = carById(r.car);
            const on = selected?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelId(r.id)}
                className={`rounded-r2 bg-paper p-3.5 text-start transition-shadow ${
                  on ? 'shadow-[inset_0_0_0_2px_#0F5249]' : 'shadow-soft'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-semibold"
                    style={{
                      background: r.flagged ? '#F8E3E1' : '#E2ECEA',
                      color: r.flagged ? '#9C352B' : '#0B3F38',
                    }}
                  >
                    {r.customer.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-ink">{r.customer.name}</span>
                      {r.justNow && (
                        <span className="dz-label rounded-full bg-clay px-1.5 py-0.5 text-[9.5px] text-white">
                          {t('req_new')}
                        </span>
                      )}
                    </div>
                    <div className="dz-xs mt-0.5 text-ink-4">
                      {car ? car[lang] : r.car} · {r.createdAt}
                    </div>
                  </div>
                  {r.flagged && <Icon name="alert" size={18} stroke="#9C352B" />}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="dz-body py-10 text-center text-ink-4">{t('req_empty')}</div>
          )}
        </div>
      </div>

      {/* detail */}
      <div className="min-h-0 min-w-0 flex-1">
        {selected ? (
          <RequestDetail key={selected.id} req={selected} />
        ) : (
          <div className="dz-body grid h-full place-items-center text-ink-4">{t('req_empty')}</div>
        )}
      </div>
    </div>
  );
}
