'use client';

/**
 * Dashboard home (design handoff §9.B.1) — live data:
 *  - 4 KPI cards (rented vehicles, revenue of approved bookings, utilisation, pending).
 *  - Latest pending requests (same query cache as the queue → reacts to decisions).
 *  - Compliance alerts computed from real insurance/visite expiry dates.
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { useLang } from '@/lib/i18n';
import { useAgencyRequests } from '@/lib/requests';
import { daysUntil, useVehicles } from '@/lib/vehicles';
import { relativeFromNow } from '@/lib/dates';
import { formatDZD } from '@dzrent/i18n';
import { Icon, type IconName } from '@/components/Icon';
import { StatusBadge } from '@/components/StatusBadge';

interface ComplianceAlert {
  plate: string;
  vehicle: string;
  type: 'insurance' | 'visite';
  daysLeft: number;
}

const ALERT_WINDOW_DAYS = 45;

export default function DashHome() {
  const { t, lang } = useLang();
  const pending = useAgencyRequests('pending');
  const approved = useAgencyRequests('approved');
  const vehicles = useVehicles();

  const pendingCount = pending.data?.counts.pending ?? 0;
  const fleet = vehicles.data?.items ?? [];
  const rented = fleet.filter((v) => v.status === 'RENTED').length;
  const utilisation = fleet.length ? Math.round((rented / fleet.length) * 100) : 0;
  const monthRevenue = (approved.data?.items ?? [])
    .filter((r) => r.bookingStatus !== 'COMPLETED')
    .reduce((sum, r) => sum + r.total, 0);

  const alerts = useMemo<ComplianceAlert[]>(() => {
    const out: ComplianceAlert[] = [];
    for (const v of fleet) {
      const name = `${v.make} ${v.model}`;
      const ins = daysUntil(v.insurancePolicies[0]?.endDate);
      if (ins !== null && ins <= ALERT_WINDOW_DAYS) {
        out.push({ plate: v.licensePlate, vehicle: name, type: 'insurance', daysLeft: ins });
      }
      const tech = daysUntil(v.documents[0]?.expiresAt);
      if (tech !== null && tech <= ALERT_WINDOW_DAYS) {
        out.push({ plate: v.licensePlate, vehicle: name, type: 'visite', daysLeft: tech });
      }
    }
    return out.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [fleet]);

  const latest = (pending.data?.items ?? []).slice(0, 5);

  const kpis: { icon: IconName; label: string; value: string; sub?: string; href?: string }[] = [
    { icon: 'fleet', label: t('kpi_active'), value: String(rented), sub: `/ ${fleet.length}` },
    { icon: 'revenue', label: t('kpi_revenue'), value: `${formatDZD(monthRevenue)} DZD` },
    { icon: 'dashboard', label: t('kpi_util'), value: `${utilisation}%` },
    { icon: 'requests', label: t('kpi_pending'), value: String(pendingCount), href: '/requests' },
  ];

  const loading = pending.isPending || vehicles.isPending;

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
                <div className={`dz-h1 dz-tnum text-ink ${loading ? 'dz-pulse' : ''}`}>
                  {loading ? '···' : k.value}
                </div>
                <div className="dz-sm mt-0.5 flex items-center gap-1.5 text-ink-3">
                  {k.label}
                  {k.sub && !loading && <span className="dz-xs text-ink-4">{k.sub}</span>}
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
        {/* Latest pending requests */}
        <section className="rounded-r3 bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="dz-h3 text-ink">{t('dash_recent_req')}</h2>
            <Link href="/requests" className="dz-sm font-semibold text-primary hover:underline">
              {t('dash_view_all')}
            </Link>
          </div>
          <ul className="mt-4 flex flex-col divide-y divide-line-3">
            {latest.map((r) => (
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
                    {r.vehicle.name} · {relativeFromNow(r.createdAt, lang)}
                  </div>
                </div>
                <StatusBadge status="pending" label={t('st_pending')} />
              </li>
            ))}
            {!pending.isPending && latest.length === 0 && (
              <li className="dz-sm py-6 text-center text-ink-4">{t('req_empty')}</li>
            )}
          </ul>
        </section>

        {/* Compliance alerts (real expiry dates) */}
        <section className="rounded-r3 bg-paper p-5 shadow-soft">
          <h2 className="dz-h3 text-ink">{t('dash_alerts')}</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {alerts.map((a) => {
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
            {!vehicles.isPending && alerts.length === 0 && (
              <li className="dz-sm py-6 text-center text-ink-4">—</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
