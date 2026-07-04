'use client';

/**
 * Requests queue — the heart of agency trust (design handoff §9.B.3).
 * Left: status tabs + request list. Right: the review/approve panel.
 * Data is live: `useAgencyRequests` hits `/bookings/agency/requests`.
 */
import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { toUiRequest, useAgencyRequests } from '@/lib/requests';
import type { RequestStatus } from '@dzrent/types';
import type { StringKey } from '@dzrent/i18n';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { RequestDetail } from './RequestDetail';

const TABS: { id: RequestStatus; key: StringKey }[] = [
  { id: 'pending', key: 'req_pending' },
  { id: 'approved', key: 'req_approved' },
  { id: 'refused', key: 'req_refused' },
];

export default function RequestsQueue() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<RequestStatus>('pending');
  const [selId, setSelId] = useState<string | null>(null);

  const query = useAgencyRequests(tab);
  const requests = useMemo(
    () => (query.data?.items ?? []).map((item) => toUiRequest(item, lang)),
    [query.data, lang],
  );
  const counts = query.data?.counts;
  const selected = requests.find((r) => r.id === selId) ?? requests[0] ?? null;

  // Drop the stale selection when the tab changes; the fallback picks the first row.
  useEffect(() => {
    setSelId(null);
  }, [tab]);

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 gap-5">
      {/* list */}
      <div className="flex w-[380px] shrink-0 flex-col">
        <div className="mb-3.5 flex gap-1.5 rounded-r2 bg-paper p-1 shadow-[inset_0_0_0_1px_#DDD7CA]">
          {TABS.map((tb) => {
            const n = counts?.[tb.id] ?? 0;
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
          {query.isPending && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="dz-pulse h-[74px] shrink-0 rounded-r2 bg-paper shadow-soft" />
              ))}
            </>
          )}

          {query.isError && (
            <div className="flex flex-col items-center gap-3 rounded-r2 bg-paper p-6 text-center shadow-soft">
              <Icon name="alert" size={22} stroke="#9C352B" />
              <div className="dz-body text-ink-2">{t('req_load_error')}</div>
              <Button variant="soft" size="sm" onClick={() => query.refetch()}>
                {t('common_retry')}
              </Button>
            </div>
          )}

          {!query.isPending &&
            !query.isError &&
            requests.map((r) => {
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
                        {r.car} · {r.createdAt}
                      </div>
                    </div>
                    {r.flagged && <Icon name="alert" size={18} stroke="#9C352B" />}
                  </div>
                </button>
              );
            })}

          {!query.isPending && !query.isError && requests.length === 0 && (
            <div className="dz-body py-10 text-center text-ink-4">{t('req_empty')}</div>
          )}
        </div>
      </div>

      {/* detail */}
      <div className="min-h-0 min-w-0 flex-1">
        {selected ? (
          <RequestDetail key={selected.id} req={selected} />
        ) : (
          <div className="dz-body grid h-full place-items-center text-ink-4">
            {query.isPending ? t('common_loading') : t('req_empty')}
          </div>
        )}
      </div>
    </div>
  );
}
