'use client';

/**
 * Agency page (design handoff §9.A.6): storefront, identity + verified badge, a
 * green trust bar, then "Ses voitures" filtered by the categories this agency has.
 */
import { Suspense, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalog } from '@/lib/catalog';
import { ApiError } from '@/lib/api';
import { useLang } from '@/lib/i18n';
import { formatDay, readSearch, searchQuery, toIso } from '@/lib/search';
import { AgencyName, CarCard, Stars } from '@/components/Cards';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Placeholder } from '@/components/Placeholder';
import { BackLink, ErrorState, Loading, Page } from '@/components/SiteShell';

function AgencyView() {
  const { t, pick, lang } = useLang();
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const s = readSearch(params);
  const [cat, setCat] = useState(s.cat);

  const q = useQuery({
    queryKey: ['agency', id, s.from, s.to],
    queryFn: () => catalog.agency(id, { from: toIso(s.from), until: toIso(s.to) }),
  });

  const categories = useMemo(() => {
    const map = new Map<string, { slug: string; nameFr: string; nameAr: string }>();
    for (const c of q.data?.cars ?? []) map.set(c.category.slug, c.category);
    return [...map.values()];
  }, [q.data]);

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data)
    return (
      <Page narrow>
        <ErrorState
          message={q.error instanceof ApiError ? q.error.message : t('err_generic')}
          onRetry={() => void q.refetch()}
        />
      </Page>
    );

  const a = q.data;
  const cars = a.cars.filter(
    (c) => (!cat || c.category.slug === cat) && (!s.model || `${c.make} ${c.model}` === s.model),
  );
  const backQuery = searchQuery({ ...s, wilaya: a.wilaya.id });
  const description = pick(a.description ?? '', a.descriptionAr);

  return (
    <Page>
      <BackLink href={`/agences${backQuery}`} label={t('common_back')} />

      <div className="overflow-hidden rounded-r4 bg-paper shadow-soft">
        <Placeholder label={`devanture · ${a.name}`} height={200} radius={0} />
        <div className="grid grid-cols-[1fr_auto] gap-6 p-6 max-md:grid-cols-1">
          <div>
            <AgencyName agency={a} size="h1" />
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
              <Stars rating={a.rating} count={a.reviewCount} />
              <span className="dz-sm inline-flex items-center gap-1.5 text-ink-3">
                <Icon name="pin" size={15} />
                {a.commune} · {pick(a.wilaya.nameFr, a.wilaya.nameAr)}
              </span>
            </div>
            {description && <p className="dz-body mt-4 max-w-2xl text-ink-2">{description}</p>}
          </div>
          <dl className="dz-sm grid content-start gap-3 text-ink-2">
            <div>
              <dt className="dz-label text-ink-4">{t('ag_contact')}</dt>
              <dd className="dz-mono mt-1" dir="ltr">
                {a.phone}
              </dd>
            </div>
            <div>
              <dt className="dz-label text-ink-4">{t('ag_address')}</dt>
              <dd className="mt-1">{a.address}</dd>
            </div>
          </dl>
        </div>
        {a.isVerified && a.verifiedAt && (
          <div className="dz-sm flex items-center gap-2 bg-primary px-6 py-3 text-white">
            <Icon name="shield" size={17} />
            {t('ag_verified_on')} {formatDay(a.verifiedAt, lang, true)} · {a.completedRentals}{' '}
            {t('res_rentals')}
          </div>
        )}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="dz-h2 text-ink">{t('ag_cars')}</h2>
          <span className="dz-sm text-ink-3">
            {formatDay(s.from, lang)} → {formatDay(s.to, lang)}
          </span>
        </div>
        {categories.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <Chip active={!cat} onClick={() => setCat('')}>
              {t('search_all_cat')}
            </Chip>
            {categories.map((c) => (
              <Chip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
                {pick(c.nameFr, c.nameAr)}
              </Chip>
            ))}
          </div>
        )}
        {cars.length === 0 ? (
          <div className="rounded-r3 bg-paper p-8 text-center shadow-soft">
            <p className="dz-body text-ink-2">{t('ag_no_cars')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
            {cars.map((c) => (
              <CarCard
                key={c.id}
                car={c}
                href={`/voitures/${c.id}${searchQuery({ from: s.from, to: s.to })}`}
              />
            ))}
          </div>
        )}
      </section>

      {a.reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="dz-h2 mb-4 text-ink">{t('ag_reviews')}</h2>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {a.reviews.map((r) => (
              <div key={r.id} className="rounded-r3 bg-paper p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{r.author}</span>
                  <Stars rating={r.overallRating} count={1} />
                </div>
                {(r.comment || r.commentAr) && (
                  <p className="dz-sm mt-2 text-ink-2">{pick(r.comment ?? '', r.commentAr)}</p>
                )}
                {r.agencyResponse && (
                  <p className="dz-sm mt-3 border-s-2 border-line-2 ps-3 text-ink-3">
                    {r.agencyResponse}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}

export default function AgencyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AgencyView />
    </Suspense>
  );
}
