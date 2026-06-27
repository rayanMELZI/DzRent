'use client';

/**
 * Revenue (design handoff §9.B.6): period chips, 3 KPI cards, a monthly bar trend
 * (last month in clay) and a revenue-by-category bar list.
 */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { CATEGORIES } from '@/lib/seed';
import { Chip } from '@/components/Chip';

type Period = 'w' | 'm' | 'y';

const BY_CATEGORY: { id: string; valueK: number }[] = [
  { id: 'suv', valueK: 642 },
  { id: 'berline', valueK: 488 },
  { id: 'prestige', valueK: 410 },
  { id: 'citadine', valueK: 196 },
  { id: 'minivan', valueK: 106 },
];

const MONTHS_K = [320, 410, 380, 520, 470, 610, 580, 690, 640, 720, 921, 1842];

export default function RevenueScreen() {
  const { t, lang } = useLang();
  const [period, setPeriod] = useState<Period>('m');

  const maxCat = Math.max(...BY_CATEGORY.map((c) => c.valueK));
  const maxMonth = Math.max(...MONTHS_K);

  const periods: { id: Period; fr: string; ar: string }[] = [
    { id: 'w', fr: 'Semaine', ar: 'أسبوع' },
    { id: 'm', fr: 'Mois', ar: 'شهر' },
    { id: 'y', fr: 'Année', ar: 'سنة' },
  ];

  const kpis: { label: string; value: string; unit?: string; trend: string }[] = [
    { label: t('kpi_revenue'), value: '1 842 000', unit: t('common_dzd'), trend: '+12%' },
    { label: lang === 'ar' ? 'عدد الحجوزات' : 'Locations', value: '64', trend: '+8%' },
    { label: lang === 'ar' ? 'متوسط القيمة' : 'Panier moyen', value: '28 800', unit: t('common_dzd'), trend: '+4%' },
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
            <span className="mt-2 inline-block rounded-full bg-status-approved-bg px-2 py-0.5 text-[12px] font-semibold text-status-approved-ink">
              {k.trend}
            </span>
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
            {MONTHS_K.map((m, i) => {
              const last = i === MONTHS_K.length - 1;
              return (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-[5px]"
                    style={{
                      height: `${(m / maxMonth) * 100}%`,
                      background: last ? '#C0613A' : '#0F5249',
                      opacity: last ? 1 : 0.8 - (MONTHS_K.length - 1 - i) * 0.03,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* by category */}
        <div className="rounded-r3 bg-paper p-5 shadow-soft">
          <h3 className="dz-h3 mb-4 text-ink">{lang === 'ar' ? 'حسب الفئة' : 'Par catégorie'}</h3>
          <div className="flex flex-col gap-3">
            {BY_CATEGORY.map((c) => {
              const cat = CATEGORIES.find((x) => x.id === c.id);
              return (
                <div key={c.id}>
                  <div className="mb-1.5 flex justify-between text-[12.5px]">
                    <span className="font-medium text-ink">{cat ? cat[lang] : c.id}</span>
                    <span className="dz-mono text-ink-3">{c.valueK}k</span>
                  </div>
                  <div className="h-[7px] rounded-full bg-sand">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(c.valueK / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
