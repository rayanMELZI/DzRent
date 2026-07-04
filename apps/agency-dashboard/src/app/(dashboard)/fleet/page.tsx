'use client';

/**
 * Fleet management (design handoff §9.B.2) — live against `/vehicles`:
 * status filter chips with counts, grid/list toggle, add-vehicle form, and a
 * per-vehicle status menu. Compliance dots use real insurance/visite expiries.
 */
import { useMemo, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import {
  daysUntil, STATUS_TO_UI, UI_TO_STATUS, useSetVehicleStatus, useVehicles, type ApiVehicle,
} from '@/lib/vehicles';
import { FLEET_STATUS, FLEET_STATUS_ORDER } from '@/lib/fleet';
import type { VehicleFleetStatus } from '@dzrent/types';
import { ApiError } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { Placeholder } from '@/components/Placeholder';
import { StatusBadge } from '@/components/StatusBadge';
import { ComplianceDot } from '@/components/ComplianceDot';
import { AddVehicleModal } from './AddVehicleModal';

type Filter = 'all' | VehicleFleetStatus;
type View = 'grid' | 'list';

/** Real days-to-expiry when known; falls back to the computed compliance flag. */
const insDays = (v: ApiVehicle) => daysUntil(v.insurancePolicies[0]?.endDate) ?? (v.hasValidInsurance ? 365 : 0);
const techDays = (v: ApiVehicle) => daysUntil(v.documents[0]?.expiresAt) ?? (v.hasValidVisite ? 365 : 0);

export default function FleetScreen() {
  const { t, lang } = useLang();
  const { showToast } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('grid');
  const [adding, setAdding] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const query = useVehicles();
  const setStatus = useSetVehicleStatus();
  const fleet = query.data?.items ?? [];

  const rows = useMemo(
    () => fleet.filter((v) => filter === 'all' || STATUS_TO_UI[v.status] === filter),
    [fleet, filter],
  );
  const countOf = (s: VehicleFleetStatus) => fleet.filter((v) => STATUS_TO_UI[v.status] === s).length;

  const insLabel = lang === 'ar' ? 'تأمين' : 'Assur.';
  const techLabel = lang === 'ar' ? 'فحص' : 'Visite';

  const changeStatus = (v: ApiVehicle, ui: VehicleFleetStatus) => {
    setMenuFor(null);
    setStatus.mutate(
      { id: v.id, status: UI_TO_STATUS[ui] },
      {
        onError: (err) =>
          showToast(err instanceof ApiError ? err.message : t('common_save_error'), 'err'),
      },
    );
  };

  /** Status menu shared by both views. */
  const statusMenu = (v: ApiVehicle) => (
    <div className="dz-pop absolute end-0 top-9 z-[120] w-44 overflow-hidden rounded-r2 bg-paper shadow-card">
      {FLEET_STATUS_ORDER.map((s) => (
        <button
          key={s}
          onClick={(e) => {
            e.stopPropagation();
            changeStatus(v, s);
          }}
          className={`flex w-full items-center gap-2 px-3 py-2 text-start text-[13px] font-medium hover:bg-sand ${
            STATUS_TO_UI[v.status] === s ? 'text-primary-deep' : 'text-ink-2'
          }`}
        >
          {STATUS_TO_UI[v.status] === s && <Icon name="check" size={13} stroke="currentColor" />}
          <span className={STATUS_TO_UI[v.status] === s ? '' : 'ps-[21px]'}>{t(FLEET_STATUS[s].labelKey)}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl" onClick={() => setMenuFor(null)}>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="flex flex-1 flex-wrap gap-1.5">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t('fleet_all')} · {fleet.length}
          </Chip>
          {FLEET_STATUS_ORDER.map((s) => (
            <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {t(FLEET_STATUS[s].labelKey)} · {countOf(s)}
            </Chip>
          ))}
        </div>
        <div className="flex gap-0.5 rounded-r1 bg-paper p-0.5 shadow-[inset_0_0_0_1px_#DDD7CA]">
          {(['grid', 'list'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`grid h-[30px] w-[34px] place-items-center rounded-[7px] ${
                view === v ? 'bg-primary-soft' : ''
              }`}
              aria-label={v}
            >
              <Icon name={v} size={17} stroke={view === v ? '#0B3F38' : '#8A8F88'} />
            </button>
          ))}
        </div>
        <Button size="sm" icon="plus" onClick={() => setAdding(true)}>
          {t('fleet_add')}
        </Button>
      </div>

      {query.isPending && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="dz-pulse h-[210px] rounded-r3 bg-paper shadow-soft" />
          ))}
        </div>
      )}

      {query.isError && (
        <div className="flex flex-col items-center gap-3 rounded-r3 bg-paper p-10 text-center shadow-soft">
          <Icon name="alert" size={22} stroke="#9C352B" />
          <Button variant="soft" size="sm" onClick={() => query.refetch()}>
            {t('common_retry')}
          </Button>
        </div>
      )}

      {!query.isPending && !query.isError && rows.length === 0 && (
        <div className="dz-body rounded-r3 bg-paper p-10 text-center text-ink-4 shadow-soft">—</div>
      )}

      {!query.isPending && !query.isError && view === 'grid' && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((v) => {
            const ui = STATUS_TO_UI[v.status];
            const st = FLEET_STATUS[ui];
            const name = `${v.make} ${v.model}`;
            return (
              <div key={v.id} className="overflow-hidden rounded-r3 bg-paper shadow-soft">
                <div className="relative">
                  <Placeholder label={`photo · ${name}`} height={120} radius={0} />
                  <div className="absolute start-2.5 top-2.5">
                    <StatusBadge status={st.badge} label={t(st.labelKey)} />
                  </div>
                  <div className="absolute end-2.5 top-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuFor(menuFor === v.id ? null : v.id);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-r1 bg-paper/90 text-ink-2 shadow-soft hover:bg-paper"
                      aria-label="statut"
                    >
                      <Icon name="gauge" size={16} stroke="currentColor" />
                    </button>
                    {menuFor === v.id && statusMenu(v)}
                  </div>
                </div>
                <div className="p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="dz-h3 truncate text-[14.5px] text-ink">{name}</span>
                    <span className="dz-mono shrink-0 text-[11.5px] text-ink-4">{v.licensePlate}</span>
                  </div>
                  <div className="dz-xs mt-0.5 text-ink-4">
                    {lang === 'ar' ? v.category.nameAr : v.category.nameFr} · {v.year}
                  </div>
                  <div className="mt-2.5 flex gap-3 border-t border-line-3 pt-2.5">
                    <ComplianceDot days={insDays(v)} label={insLabel} />
                    <ComplianceDot days={techDays(v)} label={techLabel} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!query.isPending && !query.isError && view === 'list' && (
        <div className="overflow-hidden rounded-r3 bg-paper shadow-soft">
          {rows.map((v, i) => {
            const ui = STATUS_TO_UI[v.status];
            const st = FLEET_STATUS[ui];
            const name = `${v.make} ${v.model}`;
            return (
              <div
                key={v.id}
                className={`flex items-center gap-4 px-4 py-3 ${
                  i === rows.length - 1 ? '' : 'border-b border-line-3'
                }`}
              >
                <Placeholder label={name} height={42} radius={8} style={{ width: 64, flexShrink: 0 }} />
                <div className="w-40">
                  <div className="dz-h3 text-[14px] text-ink">{name}</div>
                  <div className="dz-xs text-ink-4">
                    {lang === 'ar' ? v.category.nameAr : v.category.nameFr}
                  </div>
                </div>
                <span className="dz-mono w-32 text-[12px] text-ink-3">{v.licensePlate}</span>
                <div className="relative w-36">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuFor(menuFor === v.id ? null : v.id);
                    }}
                    className="inline-flex items-center gap-1"
                  >
                    <StatusBadge status={st.badge} label={t(st.labelKey)} />
                    <Icon name="chevron" size={13} stroke="#8A8F88" style={{ transform: 'rotate(90deg)' }} />
                  </button>
                  {menuFor === v.id && statusMenu(v)}
                </div>
                <div className="flex flex-1 gap-3.5">
                  <ComplianceDot days={insDays(v)} label={insLabel} />
                  <ComplianceDot days={techDays(v)} label={techLabel} />
                </div>
                <span className="dz-mono dz-tnum text-[12px] text-ink-3">
                  {Number(v.currentMileageKm).toLocaleString()} km
                </span>
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <AddVehicleModal
          onClose={() => setAdding(false)}
          onAdded={() => {
            showToast(lang === 'ar' ? 'أُضيفت المركبة' : 'Véhicule ajouté');
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
