'use client';

/**
 * The search form: wilaya (grouped by region) + pickup/return days + category.
 * Submitting always leads to the AGENCY list (design handoff §3.1).
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalog } from '@/lib/catalog';
import { useLang } from '@/lib/i18n';
import {
  REGION_LABEL,
  REGION_ORDER,
  addDays,
  searchQuery,
  today,
  type SearchState,
} from '@/lib/search';
import { Button } from './Button';
import { Chip } from './Chip';
import { Field, inputClass } from './Field';

export function useReferenceData() {
  const wilayas = useQuery({
    queryKey: ['wilayas'],
    queryFn: catalog.wilayas,
    staleTime: Infinity,
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: catalog.categories,
    staleTime: Infinity,
  });
  return { wilayas: wilayas.data ?? [], categories: categories.data ?? [] };
}

export function SearchBar({
  initial,
  layout = 'card',
}: {
  initial: SearchState;
  layout?: 'card' | 'inline';
}) {
  const { t, pick } = useLang();
  const router = useRouter();
  const { wilayas, categories } = useReferenceData();
  const [s, setS] = useState<SearchState>(initial);
  const [touched, setTouched] = useState(false);

  const grouped = useMemo(
    () =>
      REGION_ORDER.map((region) => ({
        region,
        items: wilayas.filter((w) => w.regionCode === region),
      })).filter((g) => g.items.length),
    [wilayas],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!s.wilaya) return;
    router.push(`/agences${searchQuery({ ...s, model: '' })}`);
  };

  const inline = layout === 'inline';

  return (
    <form
      onSubmit={submit}
      className={
        inline ? 'rounded-r3 bg-paper p-4 shadow-soft' : 'rounded-r4 bg-paper p-6 shadow-card'
      }
    >
      <div
        className={`grid gap-4 ${inline ? 'grid-cols-[1.4fr_1fr_1fr_auto] items-end max-lg:grid-cols-2' : 'grid-cols-[1.4fr_1fr_1fr] max-md:grid-cols-1'}`}
      >
        <Field label={t('search_wilaya')} icon="pin">
          <select
            className={`${inputClass} ${touched && !s.wilaya ? 'shadow-[inset_0_0_0_1.5px_#C0392B]' : ''}`}
            value={s.wilaya ?? ''}
            onChange={(e) => setS({ ...s, wilaya: Number(e.target.value) || null })}
          >
            <option value="">{t('search_wilaya_ph')}</option>
            {grouped.map((g) => (
              <optgroup
                key={g.region}
                label={pick(REGION_LABEL[g.region]!.fr, REGION_LABEL[g.region]!.ar)}
              >
                {g.items.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} · {pick(w.nameFr, w.nameAr)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label={t('search_from')} icon="calendar">
          <input
            type="date"
            className={inputClass}
            value={s.from}
            min={today()}
            onChange={(e) => {
              const from = e.target.value;
              setS({ ...s, from, to: s.to <= from ? addDays(from, 1) : s.to });
            }}
          />
        </Field>
        <Field label={t('search_to')} icon="calendar">
          <input
            type="date"
            className={inputClass}
            value={s.to}
            min={addDays(s.from, 1)}
            onChange={(e) => setS({ ...s, to: e.target.value })}
          />
        </Field>
        {inline && (
          <Button type="submit" icon="search">
            {t('search_cta')}
          </Button>
        )}
      </div>

      {!inline && (
        <>
          <div className="mt-5">
            <div className="dz-label mb-2 text-ink-3">{t('search_category')}</div>
            <div className="flex flex-wrap gap-2">
              <Chip type="button" active={!s.cat} onClick={() => setS({ ...s, cat: '' })}>
                {t('search_all_cat')}
              </Chip>
              {categories.map((c) => (
                <Chip
                  type="button"
                  key={c.slug}
                  active={s.cat === c.slug}
                  onClick={() => setS({ ...s, cat: c.slug })}
                >
                  {pick(c.nameFr, c.nameAr)}
                </Chip>
              ))}
            </div>
          </div>
          <Button type="submit" size="lg" full className="mt-6" iconRight="chevron">
            {t('search_cta')}
          </Button>
        </>
      )}
    </form>
  );
}
