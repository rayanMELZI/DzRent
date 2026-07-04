'use client';

/**
 * Blacklist (design handoff §9.B.4) — the strict inter-agency "rating":
 * one row per person, a badge counting DISTINCT reporting agencies, and each
 * report expandable to its mandatory justification. One grudge from a single
 * agency reads very differently from a cross-agency pattern.
 */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { REASON_LABELS, useBlacklistPeople, type ApiBlacklistPerson } from '@/lib/blacklist';
import { dayMonth } from '@/lib/dates';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { BlacklistModal } from './BlacklistModal';

export default function Blacklist() {
  const { t, lang } = useLang();
  const { showToast } = useStore();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const query = useBlacklistPeople(q);
  const people = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-start gap-4">
        <p className="dz-sm m-0 max-w-xl flex-1 text-ink-3">{t('bl_sub')}</p>
        <Button size="sm" variant="dark" icon="plus" onClick={() => setAdding(true)}>
          {t('bl_add')}
        </Button>
      </div>

      <label className="mb-4 flex max-w-md items-center gap-2.5 rounded-r2 bg-paper px-3.5 py-2.5 shadow-[inset_0_0_0_1px_#DDD7CA]">
        <Icon name="search" size={17} stroke="#8A8F88" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('bl_search')}
          className="dz-body w-full bg-transparent text-ink outline-none placeholder:text-ink-4"
        />
      </label>

      {query.isPending && (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="dz-pulse h-16 rounded-r3 bg-paper shadow-soft" />
          ))}
        </div>
      )}

      {query.isError && (
        <div className="flex flex-col items-center gap-3 rounded-r3 bg-paper p-8 text-center shadow-soft">
          <Icon name="alert" size={22} stroke="#9C352B" />
          <Button variant="soft" size="sm" onClick={() => query.refetch()}>
            {t('common_retry')}
          </Button>
        </div>
      )}

      {!query.isPending && !query.isError && (
        <div className="flex flex-col gap-2.5">
          {people.map((p) => (
            <PersonRow
              key={p.user.id}
              person={p}
              open={openId === p.user.id}
              onToggle={() => setOpenId(openId === p.user.id ? null : p.user.id)}
            />
          ))}
          {people.length === 0 && (
            <div className="dz-body rounded-r3 bg-paper p-10 text-center text-ink-4 shadow-soft">—</div>
          )}
        </div>
      )}

      {adding && (
        <BlacklistModal
          onClose={() => setAdding(false)}
          onAdded={() => {
            showToast(t('bl_added'));
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function PersonRow({
  person,
  open,
  onToggle,
}: {
  person: ApiBlacklistPerson;
  open: boolean;
  onToggle: () => void;
}) {
  const { t, lang } = useLang();
  const worst = person.entries.some((e) => REASON_LABELS[e.reason]?.sev === 'high');
  const agencyLabel =
    person.agencyCount === 1 ? t('bl_agencies_one') : `${person.agencyCount} ${t('bl_agencies_n')}`;

  return (
    <div className="overflow-hidden rounded-r3 bg-paper shadow-soft">
      <button onClick={onToggle} className="flex w-full items-center gap-3.5 px-[18px] py-3.5 text-start">
        <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-status-blacklist-bg text-[14px] font-semibold text-status-blacklist-ink">
          {person.user.initials}
        </div>
        <div className="w-44 min-w-0">
          <div className="truncate text-[14px] font-semibold text-ink">{person.user.name}</div>
          <div className="dz-mono text-[11.5px] text-ink-4" dir="ltr">
            {person.user.phone}
          </div>
        </div>

        {/* The strict rating: distinct agencies that filed a justified report */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold ${
            person.agencyCount > 1
              ? 'bg-status-blacklist-ink text-white'
              : 'bg-status-blacklist-bg text-status-blacklist-ink'
          }`}
        >
          <Icon
            name="shield"
            size={13}
            stroke={person.agencyCount > 1 ? '#fff' : '#7A1F17'}
          />
          {agencyLabel}
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {[...new Set(person.entries.map((e) => e.reason))].slice(0, 3).map((code) => {
            const r = REASON_LABELS[code];
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 rounded-full bg-status-blacklist-bg px-2.5 py-1 text-[11.5px] font-semibold text-status-blacklist-ink"
              >
                <span
                  className="h-[6px] w-[6px] rounded-full"
                  style={{ background: r?.sev === 'high' ? '#7A1F17' : '#E0A94E' }}
                />
                {r ? r[lang] : code}
              </span>
            );
          })}
        </div>

        <span
          className="dz-xs w-14 text-end font-semibold"
          style={{ color: worst ? '#7A1F17' : '#9A6516' }}
        >
          {worst ? t('bl_sev_high') : t('bl_sev_mid')}
        </span>
        <Icon
          name="chevron"
          size={17}
          stroke="#8A8F88"
          style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }}
        />
      </button>

      {/* Expanded: every report with its mandatory justification */}
      {open && (
        <div className="border-t border-line-3 bg-sand/60 px-[18px] py-3.5">
          <div className="flex flex-col gap-3">
            {person.entries.map((e) => {
              const r = REASON_LABELS[e.reason];
              return (
                <div key={e.id} className="text-[13px] text-ink">
                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                    <Icon name="shield" size={14} stroke="#7A1F17" />
                    <span className="text-status-blacklist-ink">{r ? r[lang] : e.reason}</span>
                    <span className="dz-xs font-normal text-ink-3">
                      — {t('bl_added_by')} <b>{e.agencyName}</b>
                      {e.isMine && ` (${lang === 'ar' ? 'وكالتك' : 'votre agence'})`} ·{' '}
                      {dayMonth(e.createdAt, lang)}
                    </span>
                  </div>
                  <p className="m-0 mt-1 ps-[22px] text-[12.5px] leading-snug text-ink-2">
                    {e.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
