'use client';

/**
 * Dashboard topbar: search, language toggle (FR/العربية), notifications, avatar.
 * In RTL, flex order follows document direction so search/avatar swap sides.
 */
import { useLang } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { agencyById, CURRENT_AGENCY_ID } from '@/lib/seed';
import { Icon } from '@/components/Icon';
import type { Lang } from '@dzrent/i18n';

export function Topbar() {
  const { lang, setLang, t } = useLang();
  const { pendingCount } = useStore();
  const agency = agencyById(CURRENT_AGENCY_ID);
  const agencyName = agency ? (lang === 'ar' ? agency.ar : agency.fr) : 'DzRent';

  const langs: { id: Lang; label: string }[] = [
    { id: 'fr', label: 'FR' },
    { id: 'ar', label: 'العربية' },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line-2 bg-paper px-6">
      <label className="flex h-10 max-w-md flex-1 items-center gap-2.5 rounded-r2 bg-sand px-3.5 text-ink-3">
        <Icon name="search" size={18} stroke="currentColor" />
        <input
          className="dz-sm w-full bg-transparent text-ink outline-none placeholder:text-ink-4"
          placeholder={t('dash_search')}
        />
      </label>

      <div className="ms-auto flex items-center gap-3">
        <div className="flex gap-0.5 rounded-r2 bg-sand p-0.5">
          {langs.map((l) => {
            const on = lang === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  on ? 'bg-primary text-white' : 'text-ink-3 hover:text-ink'
                }`}
                style={{ fontFamily: l.id === 'ar' ? 'var(--font-arabic)' : undefined }}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        <button className="relative grid h-10 w-10 place-items-center rounded-r2 text-ink-2 hover:bg-sand">
          <Icon name="bell" size={20} stroke="currentColor" />
          {pendingCount > 0 && (
            <span className="absolute end-2 top-2 inline-block h-2 w-2 rounded-full bg-clay" />
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary">
            {agencyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="leading-tight">
            <div className="dz-sm font-semibold text-ink">{agencyName}</div>
            <div className="dz-xs text-ink-4">{t('surface_agency')}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
