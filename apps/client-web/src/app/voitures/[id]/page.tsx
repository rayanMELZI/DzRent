'use client';

/**
 * Car detail + booking panel (design handoff §9.A.7–8, desktop layout).
 *
 * Left: photos placeholder, specs, features, agency snippet. Right (sticky): the
 * period, options, a LIVE quote from the backend pricing engine (the same one the
 * booking snapshot uses), the total on the green banner and — separately, never
 * summed — the quarantined deposit. Submitting creates a PENDING booking request
 * that the agency approves or refuses in its dashboard.
 */
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { catalog, type Booking, type KycStatusResponse, type QuoteOptions } from '@/lib/catalog';
import { ApiError, errorCode } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLang, type Key } from '@/lib/i18n';
import { addDays, readSearch, searchQuery, toIso, today } from '@/lib/search';
import { AgencyName, CarSpecs, Stars } from '@/components/Cards';
import { Button } from '@/components/Button';
import { Field, inputClass } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { DepositBox, PriceBreakdown, type BreakdownLine } from '@/components/Money';
import { Placeholder } from '@/components/Placeholder';
import { StatusBadge } from '@/components/StatusBadge';
import { BackLink, ErrorState, Loading, Page } from '@/components/SiteShell';

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="dz-sm flex cursor-pointer items-center justify-between gap-3 py-1.5 text-ink-2">
      {label}
      <input
        type="checkbox"
        className="h-[18px] w-[18px] accent-[#0F5249]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function CarView() {
  const { t, pick } = useLang();
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  const { status, user, authedRequest } = useAuth();
  const initial = readSearch(params);

  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [opts, setOpts] = useState<QuoteOptions>({});

  const car = useQuery({ queryKey: ['car', id], queryFn: () => catalog.vehicle(id) });

  const quote = useQuery({
    queryKey: ['quote', id, from, to, opts],
    enabled: car.isSuccess,
    retry: false,
    queryFn: () => catalog.quote({ vehicleId: id, from: toIso(from), until: toIso(to), ...opts }),
  });

  const isClient = status === 'authenticated' && user?.role === 'CLIENT';
  const kyc = useQuery({
    queryKey: ['kyc'],
    enabled: isClient,
    queryFn: () => authedRequest<{ data: KycStatusResponse }>('/kyc/me').then((r) => r.data),
  });

  const book = useMutation({
    mutationFn: () =>
      authedRequest<{ data: Booking }>('/bookings', {
        method: 'POST',
        body: {
          vehicleId: id,
          requestedFrom: toIso(from),
          requestedUntil: toIso(to),
          additionalDrivers: opts.additionalDrivers ?? 0,
          hasChildSeat: !!opts.hasChildSeat,
          hasGpsScreen: !!opts.hasGpsScreen,
          withInsuranceWaiver: !!opts.withInsuranceWaiver,
        },
      }).then((r) => r.data),
    onSuccess: (b) => router.push(`/reservations/${b.id}`),
  });

  if (car.isLoading) return <Loading />;
  if (car.isError || !car.data)
    return (
      <Page narrow>
        <ErrorState
          message={car.error instanceof ApiError ? car.error.message : t('err_generic')}
          onRetry={() => void car.refetch()}
        />
      </Page>
    );

  const c = car.data;
  const name = `${c.make} ${c.model}`;
  const q = quote.data;
  const unavailable = quote.isError && errorCode(quote.error) === 'VEHICLE_UNAVAILABLE';

  const lines: BreakdownLine[] = q
    ? [
        { label: `${t('co_subtotal')} · ${q.totalDays} ${t('co_days')}`, amount: q.subtotalDA },
        ...(q.optionsDA ? [{ label: t('co_addons'), amount: q.optionsDA }] : []),
        ...(q.insuranceAmountDA
          ? [{ label: t('car_opt_waiver'), amount: q.insuranceAmountDA }]
          : []),
        { label: `${t('vat')} (${q.taxRatePct}%)`, amount: q.taxAmountDA, muted: true },
      ]
    : [];

  const loginHref = `/connexion?next=${encodeURIComponent(`${path}${searchQuery({ from, to })}`)}`;
  const bookError = book.error ? errorCode(book.error) : null;
  const kycMissing = kyc.data && !kyc.data.isEligibleForBooking;

  return (
    <Page>
      <BackLink
        href={`/agences/${c.agency.id}${searchQuery({ from, to })}`}
        label={pick(c.agency.name, c.agency.nameAr)}
      />

      <div className="grid grid-cols-[1fr_380px] items-start gap-8 max-lg:grid-cols-1">
        {/* ── Car ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Placeholder label={`photo · ${name}`} height={320} />
            <div className="grid gap-3">
              <Placeholder label="intérieur" height={154} />
              <Placeholder label="coffre" height={154} />
            </div>
          </div>

          <div className="rounded-r3 bg-paper p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="dz-h1 text-ink">{name}</h1>
                <p className="dz-sm mt-1 text-ink-3">
                  {pick(c.category.nameFr, c.category.nameAr)} · {c.year} · {t('car_color')}{' '}
                  {c.color}
                </p>
              </div>
              <StatusBadge status="approved" label={t('car_available')} />
            </div>

            <h2 className="dz-label mt-6 text-ink-3">{t('car_specs')}</h2>
            <div className="mt-3 grid grid-cols-4 gap-3 max-md:grid-cols-2">
              {[
                { icon: 'seat' as const, v: `${c.seats} ${t('car_seats')}` },
                {
                  icon: 'gear' as const,
                  v: c.transmission === 'AUTOMATIC' ? t('car_trans_auto') : t('car_trans_man'),
                },
                { icon: 'fuel' as const, v: t(`fuel_${c.fuelType}` as Key) },
                { icon: 'car' as const, v: `${c.doors} ${t('car_doors')}` },
              ].map((s) => (
                <div key={s.icon} className="rounded-r2 bg-sand px-3 py-3">
                  <Icon name={s.icon} size={18} className="text-primary" />
                  <div className="dz-sm mt-1.5 font-medium text-ink">{s.v}</div>
                </div>
              ))}
            </div>

            {c.features.length > 0 && (
              <>
                <h2 className="dz-label mt-6 text-ink-3">{t('car_features')}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.features.map((f) => (
                    <span
                      key={f}
                      className="dz-sm rounded-full bg-primary-soft px-3 py-1 text-primary-deep"
                    >
                      {t(`feature_${f}` as Key) === `feature_${f}` ? f : t(`feature_${f}` as Key)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <Link
            href={`/agences/${c.agency.id}${searchQuery({ from, to })}`}
            className="flex items-center justify-between gap-4 rounded-r3 bg-paper p-5 shadow-soft hover:shadow-card"
          >
            <div>
              <div className="dz-label text-ink-4">{t('car_by')}</div>
              <div className="mt-1.5">
                <AgencyName agency={c.agency} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4">
                <Stars rating={c.agency.rating} count={c.agency.reviewCount} />
                <span className="dz-sm text-ink-3">
                  {c.agency.commune} · {c.agency.completedRentals} {t('res_rentals')}
                </span>
              </div>
            </div>
            <Icon name="chevron" size={20} className="dz-flip text-ink-4" />
          </Link>
        </div>

        {/* ── Booking panel ───────────────────────────────────────────────── */}
        <aside className="sticky top-24 flex flex-col gap-4 rounded-r4 bg-paper p-5 shadow-card max-lg:static">
          <div className="flex items-baseline gap-1">
            <span className="dz-h1 text-ink">
              {new Intl.NumberFormat('fr-FR').format(c.pricing.dailyRateDA)} {t('common_dzd')}
            </span>
            <span className="dz-sm text-ink-4">{t('common_per_day')}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('search_from')}>
              <input
                type="date"
                className={inputClass}
                value={from}
                min={today()}
                onChange={(e) => {
                  const v = e.target.value;
                  setFrom(v);
                  if (to <= v) setTo(addDays(v, 1));
                }}
              />
            </Field>
            <Field label={t('search_to')}>
              <input
                type="date"
                className={inputClass}
                value={to}
                min={addDays(from, 1)}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
          </div>

          <div>
            <div className="dz-label mb-1 text-ink-3">{t('car_options')}</div>
            <Toggle
              label={t('car_opt_waiver')}
              checked={!!opts.withInsuranceWaiver}
              onChange={(v) => setOpts({ ...opts, withInsuranceWaiver: v })}
            />
            <Toggle
              label={t('car_opt_driver')}
              checked={(opts.additionalDrivers ?? 0) > 0}
              onChange={(v) => setOpts({ ...opts, additionalDrivers: v ? 1 : 0 })}
            />
            <Toggle
              label={t('car_opt_seat')}
              checked={!!opts.hasChildSeat}
              onChange={(v) => setOpts({ ...opts, hasChildSeat: v })}
            />
            <Toggle
              label={t('car_opt_gps')}
              checked={!!opts.hasGpsScreen}
              onChange={(v) => setOpts({ ...opts, hasGpsScreen: v })}
            />
          </div>

          {unavailable ? (
            <p className="dz-sm rounded-r2 bg-status-refused-bg px-3 py-2.5 text-status-refused-ink">
              {t('car_unavailable')}
            </p>
          ) : quote.isError ? (
            <p className="dz-sm text-status-refused-ink">
              {quote.error instanceof ApiError ? quote.error.message : t('err_generic')}
            </p>
          ) : q ? (
            <>
              <PriceBreakdown lines={lines} total={q.totalAmountDA} />
              <DepositBox amount={q.depositAmountDA} />
            </>
          ) : (
            <div className="dz-sm py-6 text-center text-ink-4">{t('common_loading')}</div>
          )}

          {status === 'authenticated' && user?.role !== 'CLIENT' ? (
            <p className="dz-sm rounded-r2 bg-status-pending-bg px-3 py-2.5 text-status-pending-ink">
              {t('login_agency_account')}
            </p>
          ) : kycMissing || bookError === 'KYC_INCOMPLETE' ? (
            <div className="rounded-r2 bg-status-pending-bg px-3 py-3 text-status-pending-ink">
              <p className="dz-sm">{t('car_kyc_needed')}</p>
              <Link href="/documents" className="dz-sm mt-1.5 inline-block font-semibold underline">
                {t('car_kyc_go')}
              </Link>
            </div>
          ) : null}

          {book.isError && bookError !== 'KYC_INCOMPLETE' && (
            <p className="dz-sm text-status-refused-ink">
              {book.error instanceof ApiError ? book.error.message : t('err_generic')}
            </p>
          )}

          {status !== 'authenticated' ? (
            <Button full size="lg" onClick={() => router.push(loginHref)} iconRight="chevron">
              {t('car_book_login')}
            </Button>
          ) : (
            <Button
              full
              size="lg"
              disabled={!q || unavailable || !isClient || !!kycMissing || book.isPending}
              onClick={() => book.mutate()}
              iconRight="chevron"
            >
              {t('car_book_send')}
            </Button>
          )}
          <p className="dz-xs flex items-start gap-1.5 text-ink-4">
            <Icon name="lock" size={14} className="mt-px shrink-0" />
            {t('car_book_note')}
          </p>
        </aside>
      </div>
    </Page>
  );
}

export default function CarPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CarView />
    </Suspense>
  );
}
