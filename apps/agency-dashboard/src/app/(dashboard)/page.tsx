'use client';

/**
 * Dashboard home (design handoff §9.B.1):
 *  - 4 KPI cards (active rentals, monthly revenue, fleet utilisation, pending).
 *  - Latest requests (live, flagged ones marked).
 *  - Compliance alerts (insurance / visite technique expiries, urgency-sorted).
 */
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { carById } from '@/lib/seed';
import { formatDZD } from '@dzrent/i18n';
import { Icon, type IconName } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';

interface ComplianceAlert {
  plate: string;
  vehicle: string;
  type: 'insurance' | 'visite';
  daysLeft: number;
}

// Stand-in compliance data until the vehicles endpoint is wired.
const COMPLIANCE_ALERTS: ComplianceAlert[] = [
  { plate: '00123-16', vehicle: 'Mercedes Classe C', type: 'insurance', daysLeft: 6 },
  { plate: '04567-16', vehicle: 'VW Golf 8', type: 'visite', daysLeft: 9 },
  { plate: '08891-16', vehicle: 'Hyundai Tucson', type: 'insurance', daysLeft: 21 },
  { plate: '01044-16', vehicle: 'Dacia Logan', type: 'visite', daysLeft: 28 },
];

export default function DashHome() {
  const { t, lang } = useLang();
  const { requests, pendingCount } = useStore();

  const activeRentals = requests.filter((r) => r.status === 'approved').length;
  const monthRevenue = requests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.total, 0);
  const utilisation = 72;

  const kpis: { icon: IconName; label: string; value: string; sub?: string; href?: string }[] = [
    { icon: 'fleet', label: t('kpi_active'), value: String(activeRentals), sub: '/ 18' },
    { icon: 'revenue', label: t('kpi_revenue'), value: `${formatDZD(monthRevenue)} DZD`, sub: '+12%' },
    { icon: 'dashboard', label: t('kpi_util'), value: `${utilisation}%` },
    { icon: 'requests', label: t('kpi_pending'), value: String(pendingCount), href: '/requests' },
  ];

  const latest = requests.slice(0, 5);

  return (
    <div className="dz-enter mx-auto max-w-6xl">
      <h1 className="dz-h1 text-ink">{t('dash_nav_home')}</h1>
      <p className="dz-sm mt-1 text-ink-3">{t('tagline')}</p>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const card = (
            <div className="flex h-full flex-col justify-between rounded-r3 bg-paper p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-r2 bg-primary-soft text-primary">
                  <Icon name={k.icon} size={18} stroke="currentColor" />
                </span>
                {k.href && <Icon name="chevron" size={16} stroke="#8A8F88" className="dz-flip" />}
              </div>
              <div className="mt-4">
                <div className="dz-h1 dz-tnum text-ink">{k.value}</div>
                <div className="dz-sm mt-0.5 flex items-center gap-1.5 text-ink-3">
                  {k.label}
                  {k.sub && <span className="dz-xs text-ink-4">{k.sub}</span>}
                </div>
              </div>
            </div>
          );
          return k.href ? (
            <Link key={k.label} href={'/requests'} className="block">
              {card}
            </Link>
          ) : (
            <div key={k.label}>{card}</div>
          );
        })}
      </div>

      {/* Panels */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Latest requests */}
        <section className="rounded-r3 bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="dz-h3 text-ink">{t('dash_recent_req')}</h2>
            <Link href="/requests" className="dz-sm font-semibold text-primary hover:underline">
              {t('dash_view_all')}
            </Link>
          </div>
          <ul className="mt-4 flex flex-col divide-y divide-line-3">
            {latest.map((r) => {
              const car = carById(r.car);
              const carName = car ? (lang === 'ar' ? car.ar : car.fr) : r.car;
              const statusToken =
                r.status === 'approved' ? 'approved' : r.status === 'refused' ? 'refused' : 'pending';
              const statusLabel =
                r.status === 'approved'
                  ? t('st_approved')
                  : r.status === 'refused'
                    ? t('st_refused')
                    : t('st_pending');
              return (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand text-[12px] font-semibold text-ink-2">
                    {r.customer.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="dz-sm flex items-center gap-1.5 font-semibold text-ink">
                      <span className="truncate">{r.customer.name}</span>
                      {r.flagged && <Icon name="alert" size={14} stroke="#C0392B" />}
                    </div>
                    <div className="dz-xs truncate text-ink-3">
                      {carName} · {r.createdAt}
                    </div>
                  </div>
                  <StatusBadge status={statusToken} label={statusLabel} />
                </li>
              );
            })}
          </ul>
        </section>

        {/* Compliance alerts */}
        <section className="rounded-r3 bg-paper p-5 shadow-soft">
          <h2 className="dz-h3 text-ink">{t('dash_alerts')}</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {[...COMPLIANCE_ALERTS]
              .sort((a, b) => a.daysLeft - b.daysLeft)
              .map((a) => {
                const urgent = a.daysLeft <= 10;
                const accent = urgent ? '#C0392B' : '#E0A94E';
                const label = a.type === 'insurance' ? t('dash_alert_ins') : t('dash_alert_tech');
                return (
                  <li
                    key={a.plate + a.type}
                    className="flex items-center gap-3 rounded-r2 border border-line-3 px-3 py-2.5"
                  >
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: accent }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="dz-sm font-medium text-ink">{a.vehicle}</div>
                      <div className="dz-xs text-ink-3">
                        <span className="dz-mono">{a.plate}</span> · {label}
                      </div>
                    </div>
                    <span className="dz-sm dz-tnum font-semibold" style={{ color: accent }}>
                      {a.daysLeft} {t('dash_days')}
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      </div>
    </div>
  );
}
