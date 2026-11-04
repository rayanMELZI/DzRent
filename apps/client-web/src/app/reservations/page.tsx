'use client';

/** My bookings — every request with its live status (shared status vocabulary). */
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BOOKING_BADGE, num, type Booking } from '@/lib/catalog';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLang, type Key } from '@/lib/i18n';
import { formatDay } from '@/lib/search';
import { Dzd } from '@/components/Money';
import { Icon } from '@/components/Icon';
import { RequireAuth } from '@/components/RequireAuth';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, Loading, Page } from '@/components/SiteShell';

function Trips() {
  const { t, lang } = useLang();
  const { authedRequest } = useAuth();
  const q = useQuery({
    queryKey: ['bookings'],
    queryFn: () => authedRequest<{ items: Booking[]; total: number }>('/bookings/me?limit=50'),
    refetchInterval: 20_000,
  });

  return (
    <Page narrow>
      <h1 className="dz-h1 mb-6 text-ink">{t('trips_title')}</h1>
      {q.isLoading ? (
        <Loading />
      ) : q.isError ? (
        <ErrorState
          message={q.error instanceof ApiError ? q.error.message : t('err_generic')}
          onRetry={() => void q.refetch()}
        />
      ) : !q.data?.items.length ? (
        <div className="rounded-r3 bg-paper p-10 text-center shadow-soft">
          <Icon name="trips" size={28} className="mx-auto text-ink-4" />
          <p className="dz-body mt-3 text-ink-2">{t('trips_empty')}</p>
          <Link
            href="/"
            className="dz-sm mt-3 inline-block font-semibold text-primary hover:underline"
          >
            {t('search_cta')}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {q.data.items.map((b) => (
            <Link
              key={b.id}
              href={`/reservations/${b.id}`}
              className="flex items-center justify-between gap-4 rounded-r3 bg-paper p-5 shadow-soft hover:shadow-card"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="dz-h3 text-ink">
                    {b.vehicle.make} {b.vehicle.model}
                  </span>
                  <StatusBadge
                    status={BOOKING_BADGE[b.status]}
                    label={t(`bst_${b.status}` as Key)}
                  />
                </div>
                <div className="dz-sm mt-1 text-ink-3">
                  {b.agency.name} · {formatDay(b.requestedFrom, lang)} →{' '}
                  {formatDay(b.requestedUntil, lang)}
                </div>
                <div className="dz-xs mt-1 text-ink-4">
                  {t('trips_ref')} <span className="dz-mono">{b.bookingRef}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Dzd amount={num(b.totalAmountDA)} className="dz-mono font-semibold text-ink" />
                <Icon name="chevron" size={18} className="dz-flip text-ink-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}

export default function TripsPage() {
  return (
    <RequireAuth>
      <Trips />
    </RequireAuth>
  );
}
