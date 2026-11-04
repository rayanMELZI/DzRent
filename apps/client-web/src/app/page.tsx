'use client';

/** Home — green hero with the search card, how-it-works and the trust strip. */
import { useLang } from '@/lib/i18n';
import { defaultSearch } from '@/lib/search';
import { SearchBar } from '@/components/SearchBar';
import { Icon, type IconName } from '@/components/Icon';

export default function HomePage() {
  const { t } = useLang();

  const trust: { icon: IconName; title: string; sub: string }[] = [
    { icon: 'shield', title: t('home_trust1'), sub: t('home_trust1_sub') },
    { icon: 'refund', title: t('home_trust2'), sub: t('home_trust2_sub') },
    { icon: 'phone', title: t('home_trust3'), sub: t('home_trust3_sub') },
  ];
  const steps = [t('home_step1'), t('home_step2'), t('home_step3')];

  return (
    <>
      <section className="bg-primary">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_1.15fr] items-center gap-12 px-6 py-16 max-lg:grid-cols-1">
          <div className="text-white">
            <p className="dz-label text-white/70">{t('search_greeting')}</p>
            <h1 className="dz-display mt-3 max-w-md">{t('home_hero')}</h1>
            <p className="dz-body mt-4 max-w-md text-white/80">{t('tagline')}</p>
            <ol className="mt-8 flex flex-col gap-3">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="dz-mono grid h-7 w-7 place-items-center rounded-full bg-white/15 text-[13px] font-semibold">
                    {i + 1}
                  </span>
                  <span className="dz-body text-white/90">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="dz-pop">
            <SearchBar initial={defaultSearch()} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
          {trust.map((c) => (
            <div key={c.title} className="rounded-r3 bg-paper p-6 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-r2 bg-primary-soft text-primary-deep">
                <Icon name={c.icon} size={22} className={c.icon === 'refund' ? 'dz-flip' : ''} />
              </span>
              <div className="dz-h3 mt-4 text-ink">{c.title}</div>
              <p className="dz-sm mt-1.5 text-ink-3">{c.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
