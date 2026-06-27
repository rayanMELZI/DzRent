'use client';

/**
 * Fleet management (design handoff §9.B.2): status filter chips with counts,
 * grid/list toggle, add-vehicle CTA. Each vehicle shows its plate (mono) and two
 * compliance dots (assurance, visite) colored by days-to-expiry.
 */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { CATEGORIES, carById, FLEET, type FleetVehicle } from '@/lib/seed';
import { FLEET_STATUS, FLEET_STATUS_ORDER } from '@/lib/fleet';
import { Icon } from '@/components/Icon';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { Placeholder } from '@/components/Placeholder';
import { StatusBadge } from '@/components/StatusBadge';
import { ComplianceDot } from '@/components/ComplianceDot';

type Filter = 'all' | FleetVehicle['status'];
type View = 'grid' | 'list';

export default function FleetScreen() {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('grid');

  const rows = FLEET.filter((f) => filter === 'all' || f.status === filter);
  const insLabel = lang === 'ar' ? 'تأمين' : 'Assur.';
  const techLabel = lang === 'ar' ? 'فحص' : 'Visite';

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="flex flex-1 flex-wrap gap-1.5">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t('fleet_all')} · {FLEET.length}
          </Chip>
          {FLEET_STATUS_ORDER.map((s) => (
            <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {t(FLEET_STATUS[s].labelKey)} · {FLEET.filter((f) => f.status === s).length}
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
        <Button size="sm" icon="plus">
          {t('fleet_add')}
        </Button>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((f) => {
            const car = carById(f.car);
            const st = FLEET_STATUS[f.status];
            return (
              <div key={f.id} className="overflow-hidden rounded-r3 bg-paper shadow-soft">
                <div className="relative">
                  <Placeholder label={`photo · ${car?.fr ?? f.car}`} height={120} radius={0} />
                  <div className="absolute start-2.5 top-2.5">
                    <StatusBadge status={st.badge} label={t(st.labelKey)} />
                  </div>
                </div>
                <div className="p-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="dz-h3 text-[14.5px] text-ink">{car ? car[lang] : f.car}</span>
                    <span className="dz-mono text-[11.5px] text-ink-4">{f.plate}</span>
                  </div>
                  <div className="mt-2.5 flex gap-3 border-t border-line-3 pt-2.5">
                    <ComplianceDot days={f.insDaysLeft} label={insLabel} />
                    <ComplianceDot days={f.techDaysLeft} label={techLabel} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-r3 bg-paper shadow-soft">
          {rows.map((f, i) => {
            const car = carById(f.car);
            const st = FLEET_STATUS[f.status];
            const cat = car ? CATEGORIES.find((x) => x.id === car.cat) : undefined;
            return (
              <div
                key={f.id}
                className={`flex items-center gap-4 px-4 py-3 ${
                  i === rows.length - 1 ? '' : 'border-b border-line-3'
                }`}
              >
                <Placeholder label={car?.fr ?? f.car} height={42} radius={8} style={{ width: 64, flexShrink: 0 }} />
                <div className="w-40">
                  <div className="dz-h3 text-[14px] text-ink">{car ? car[lang] : f.car}</div>
                  <div className="dz-xs text-ink-4">{cat ? cat[lang] : ''}</div>
                </div>
                <span className="dz-mono w-32 text-[12px] text-ink-3">{f.plate}</span>
                <div className="w-32">
                  <StatusBadge status={st.badge} label={t(st.labelKey)} />
                </div>
                <div className="flex flex-1 gap-3.5">
                  <ComplianceDot days={f.insDaysLeft} label={insLabel} />
                  <ComplianceDot days={f.techDaysLeft} label={techLabel} />
                </div>
                <Icon name="chevron" size={18} stroke="#8A8F88" className="dz-flip" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
