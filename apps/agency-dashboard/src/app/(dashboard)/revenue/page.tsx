'use client';

/**
 * Revenue (design handoff §9.B.6) — live analytics: period chips drive the 3
 * KPI cards (rolling windows with previous-window trend), a real 12-month bar
 * trend (current month in clay) and a revenue-by-category bar list.
 */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useAgencyRevenue } from '@/lib/revenue';
import { formatDZD } from '@dzrent/i18n';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';

type Period = 'w' | 'm' | 'y';

/** "2026-07" → localized short month label. */
function monthLabel(iso: string, lang: 'fr' | 'ar'): string {
  const [y, m] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(lang, { month: 'narrow' }).format(new Date(Date.UTC(y!, m! - 1, 1)));
}

export default function RevenueScreen() {
  const { t, lang } = useLang();
  const [period, setPeriod] = useState<Period>('m');
  const query = useAgencyRevenue();

  const periods: { id: Period; fr: string; ar: string }[] = [
    { id: 'w', fr: 'Semaine', ar: 'أسبوع' },
    { id: 'm', fr: 'Mois', ar: 'شهر' },
    { id: 'y', fr: 'Année', ar: 'سنة' },
  ];

  if (query.isPending) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="dz-pulse h-28 rounded-r3 bg-paper shadow-soft" />
          ))}
        </div>
        <div className="dz-pulse h-56 rounded-r3 bg-paper shadow-soft" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 rounded-r3 bg-paper p-10 text-center shadow-soft">
        <Icon name="alert" size={22} stroke="#9C352B" />
        <Button variant="soft" size="sm" onClick={() => query.refetch()}>
          {t('common_retry')}
        </Button>
      </div>
    );
  }

  const data = query.data;
  const win = data.periods[period];
  const maxMonth = Math.max(1, ...data.months.map((m) => m.revenue));
  const maxCat = Math.max(1, ...data.byCategory.map((c) => c.revenue));

  const kpis: { label: string; value: string; unit?: string; trendPct: number | null }[] = [
    { label: t('kpi_revenue'), value: formatDZD(win.revenue), unit: t('common_dzd'), trendPct: win.trendPct },
    { label: lang === 'ar' ? 'عدد الحجوزات' : 'Locations', value: String(win.rentals), trendPct: null },
    { label: lang === 'ar' ? 'متوسط القيمة' : 'Panier moyen', value: formatDZD(win.avg), unit: t('common_dzd'), trendPct: null },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex gap-1.5">
        {periods.map((p) => (
          <Chip key={p.id} active={period === p.id} onClick={() => setPeriod(p.id)}>
            {lang === 'ar' ? p.ar : p.fr}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-r3 bg-paper p-[18px] shadow-soft">
            <div className="dz-sm text-ink-3">{k.label}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="dz-mono text-[25px] font-semibold text-ink">{k.value}</span>
              {k.unit && <span className="dz-xs text-ink-4">{k.unit}</span>}
            </div>
            {k.trendPct !== null && (
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                  k.trendPct >= 0
                    ? 'bg-status-approved-bg text-status-approved-ink'
                    : 'bg-status-refused-bg text-status-refused-ink'
                }`}
              >
                {k.trendPct >= 0 ? '+' : ''}
                {k.trendPct}%
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        {/* monthly trend */}
        <div className="rounded-r3 bg-paper p-5 shadow-soft">
          <h3 className="dz-h3 mb-4 text-ink">
            {lang === 'ar' ? 'الإيراد الشهري' : 'Revenu mensuel'}{' '}
            <span className="dz-xs font-normal text-ink-4">(k {t('common_dzd')})</span>
          </h3>
          <div className="flex h-40 items-end gap-1.5">
            {data.months.map((m, i) => {
              const last = i === data.months.length - 1;
              return (
                <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-t-[5px]"
                    title={`${m.month} · ${formatDZD(m.revenue)} DZD`}
                    style={{
                      height: `${Math.max(2, (m.revenue / maxMonth) * 100)}%`,
                      background: last ? '#C0613A' : '#0F5249',
                      opacity: last ? 1 : 0.8 - (data.months.length - 1 - i) * 0.03,
                    }}
                  />
                  <span className="dz-xs text-ink-4">{monthLabel(m.month, lang)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* by category */}
        <div className="rounded-r3 bg-paper p-5 shadow-soft">
          <h3 className="dz-h3 mb-4 text-ink">{lang === 'ar' ? 'حسب الفئة' : 'Par catégorie'}</h3>
          <div className="flex flex-col gap-3">
            {data.byCategory.map((c) => (
              <div key={c.slug}>
                <div className="mb-1.5 flex justify-between text-[12.5px]">
                  <span className="font-medium text-ink">{lang === 'ar' ? c.nameAr : c.nameFr}</span>
                  <span className="dz-mono text-ink-3">{Math.round(c.revenue / 1000)}k</span>
                </div>
                <div className="h-[7px] rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(c.revenue / maxCat) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.byCategory.length === 0 && (
              <div className="dz-sm py-6 text-center text-ink-4">—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
