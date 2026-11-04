'use client';

/**
 * Results = AGENCY LIST (design handoff §3.1 / §9.A.5). Filtering by category or
 * model still yields agencies — you enter an agency to see its cars.
 */
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalog } from '@/lib/catalog';
import { ApiError } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { daysBetween, formatDay, readSearch, searchQuery, toIso } from '@/lib/search';
import { SearchBar, useReferenceData } from '@/components/SearchBar';
import { AgencyCard } from '@/components/Cards';
import { Chip } from '@/components/Chip';
import { inputClass } from '@/components/Field';
import { ErrorState, Loading, Page } from '@/components/SiteShell';
import { Icon } from '@/components/Icon';

function Results() {
  const { t, pick, lang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const s = readSearch(params);
  const { wilayas, categories } = useReferenceData();
  const wilaya = wilayas.find((w) => w.id === s.wilaya);

  const q = useQuery({
    queryKey: ['agencies', s.wilaya, s.from, s.to, s.cat, s.model],
    enabled: !!s.wilaya,
    queryFn: () =>
      catalog.searchAgencies({
        wilayaId: s.wilaya!,
        from: toIso(s.from),
        until: toIso(s.to),
        categorySlug: s.cat || undefined,
        model: s.model || undefined,
      }),
  });

  const go = (patch: Partial<typeof s>) =>
    router.replace(`/agences${searchQuery({ ...s, ...patch })}`, { scroll: false });

  return (
    <Page>
      <SearchBar key={params.toString()} initial={s} layout="inline" />

      {!s.wilaya ? (
        <div className="mt-8 rounded-r3 bg-paper p-10 text-center shadow-soft">
          <Icon name="pin" size={28} className="mx-auto text-primary" />
          <p className="dz-body mt-3 text-ink-2">{t('search_wilaya_ph')}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-[240px_1fr] gap-8 max-lg:grid-cols-1">
          <aside className="flex flex-col gap-6">
            <div>
              <div className="dz-label mb-2 text-ink-3">{t('search_category')}</div>
              <div className="flex flex-wrap gap-2">
                <Chip active={!s.cat} onClick={() => go({ cat: '', model: '' })}>
                  {t('search_all_cat')}
                </Chip>
                {categories.map((c) => (
                  <Chip
                    key={c.slug}
                    active={s.cat === c.slug}
                    onClick={() => go({ cat: c.slug, model: '' })}
                  >
                    {pick(c.nameFr, c.nameAr)}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="dz-label mb-2 text-ink-3">{t('res_filter_model')}</div>
              <select
                className={inputClass}
                value={s.model}
                onChange={(e) => go({ model: e.target.value })}
              >
                <option value="">{t('res_all_models')}</option>
                {(q.data?.models ?? []).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h1 className="dz-h1 text-ink">
                {t('res_title')}
                {wilaya && (
                  <span className="text-ink-3"> · {pick(wilaya.nameFr, wilaya.nameAr)}</span>
                )}
              </h1>
              <span className="dz-sm text-ink-3">
                {formatDay(s.from, lang)} → {formatDay(s.to, lang)} · {daysBetween(s.from, s.to)}{' '}
                {t('co_days')}
              </span>
            </div>

            {q.isLoading ? (
              <Loading />
            ) : q.isError ? (
              <ErrorState
                message={q.error instanceof ApiError ? q.error.message : t('err_generic')}
                onRetry={() => void q.refetch()}
              />
            ) : q.data && q.data.items.length === 0 ? (
              <div className="rounded-r3 bg-paper p-10 text-center shadow-soft">
                <p className="dz-h3 text-ink">{t('res_none')}</p>
                <p className="dz-sm mt-1.5 text-ink-3">{t('res_none_sub')}</p>
              </div>
            ) : (
              <>
                <p className="dz-sm mb-3 text-ink-3">
                  {q.data?.total} {q.data?.total === 1 ? t('res_count_one') : t('res_count_n')}
                  {s.model && (
                    <>
                      {' '}
                      · {t('res_filtered')} <strong className="text-ink">{s.model}</strong>
                    </>
                  )}
                </p>
                <div className="flex flex-col gap-4">
                  {q.data?.items.map((a) => (
                    <AgencyCard
                      key={a.id}
                      agency={a}
                      href={`/agences/${a.id}${searchQuery({ from: s.from, to: s.to, cat: s.cat, model: s.model })}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </Page>
  );
}

export default function AgenciesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Results />
    </Suspense>
  );
}
