'use client';

/**
 * Booking confirmation / status (design handoff §9.A.11). Reads the booking by id
 * and re-polls while the agency decides, so approving or refusing in the agency
 * dashboard flips this screen live: pending → approved/active → or refused (no
 * amount debited). Total and deposit stay visually separate.
 */
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOOKING_BADGE, num, type Booking, type BookingStatus } from '@/lib/catalog';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLang, type Key } from '@/lib/i18n';
import { formatDay } from '@/lib/search';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { DepositBox, Dzd } from '@/components/Money';
import { RequireAuth } from '@/components/RequireAuth';
import { StatusBadge } from '@/components/StatusBadge';
import { BackLink, ErrorState, Loading, Page } from '@/components/SiteShell';

const WAITING: BookingStatus[] = ['PENDING', 'APPROVED', 'AWAITING_PAYMENT', 'PAID'];
const CANCELLABLE: BookingStatus[] = ['PENDING', 'APPROVED', 'AWAITING_PAYMENT'];
const REFUSED: BookingStatus[] = ['CANCELLED_AGENCY'];

function Timeline({ status }: { status: BookingStatus }) {
  const { t } = useLang();
  const reached = (s: number) =>
    s === 0 ||
    (s === 1 && status !== 'PENDING') ||
    (s === 2 && ['PAID', 'ACTIVE', 'COMPLETED'].includes(status));
  const steps = [t('cf_sent'), t('bst_APPROVED'), t('cf_active')];
  return (
    <ol className="flex items-center gap-3">
      {steps.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2.5">
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
              reached(i) ? 'bg-primary text-white' : 'bg-sand text-ink-4'
            }`}
          >
            {reached(i) ? <Icon name="check" size={15} sw={2.4} /> : i + 1}
          </span>
          <span className={`dz-sm ${reached(i) ? 'font-medium text-ink' : 'text-ink-4'}`}>
            {label}
          </span>
          {i < steps.length - 1 && <span className="h-px flex-1 bg-line-2" />}
        </li>
      ))}
    </ol>
  );
}

function BookingView() {
  const { t, lang } = useLang();
  const { id } = useParams<{ id: string }>();
  const { authedRequest } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['booking', id],
    queryFn: () => authedRequest<{ data: Booking }>(`/bookings/${id}`).then((r) => r.data),
    refetchInterval: (query) =>
      query.state.data && WAITING.includes(query.state.data.status) ? 8_000 : false,
  });

  const cancel = useMutation({
    mutationFn: () => authedRequest(`/bookings/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['booking', id] });
      void qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

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

  const b = q.data;
  const refused = REFUSED.includes(b.status);
  const headline =
    b.status === 'PENDING'
      ? { title: t('cf_sent'), sub: t('cf_sent_sub') }
      : refused
        ? { title: t('bst_CANCELLED_AGENCY'), sub: t('bk_refused_sub') }
        : ['APPROVED', 'AWAITING_PAYMENT', 'PAID'].includes(b.status)
          ? { title: t('bst_APPROVED'), sub: t('bk_approved_sub') }
          : { title: t(`bst_${b.status}` as Key), sub: '' };

  const from = b.confirmedFrom ?? b.requestedFrom;
  const until = b.confirmedUntil ?? b.requestedUntil;

  return (
    <Page narrow>
      <BackLink href="/reservations" label={t('trips_title')} />

      <div
        className={`rounded-r4 p-6 shadow-card ${refused ? 'bg-status-refused-bg' : 'bg-paper'}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={`dz-h1 ${refused ? 'text-status-refused-ink' : 'text-ink'}`}>
              {headline.title}
            </h1>
            {headline.sub && <p className="dz-body mt-1.5 max-w-xl text-ink-2">{headline.sub}</p>}
          </div>
          <StatusBadge status={BOOKING_BADGE[b.status]} label={t(`bst_${b.status}` as Key)} />
        </div>
        {!refused && !b.status.startsWith('CANCELLED') && (
          <div className="mt-6">
            <Timeline status={b.status} />
          </div>
        )}
        {WAITING.includes(b.status) && (
          <p className="dz-xs mt-4 inline-flex items-center gap-1.5 text-ink-4">
            <span className="dz-pulse h-2 w-2 rounded-full bg-status-pending-dot" />
            {t('bk_live')}
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5 max-md:grid-cols-1">
        <div className="rounded-r3 bg-paper p-5 shadow-soft">
          <div className="dz-label text-ink-4">{t('bk_title')}</div>
          <div className="dz-h2 mt-2 text-ink">
            {b.vehicle.make} {b.vehicle.model}
          </div>
          <div className="dz-sm mt-1 text-ink-3">{b.agency.name}</div>
          <dl className="dz-sm mt-4 grid gap-2 text-ink-2">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-4">{t('co_period')}</dt>
              <dd>
                {formatDay(from, lang)} → {formatDay(until, lang)} · {b.totalDays} {t('co_days')}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-4">{t('trips_ref')}</dt>
              <dd className="dz-mono">{b.bookingRef}</dd>
            </div>
            {b.agency.phone && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-4">{t('bk_agency_phone')}</dt>
                <dd className="dz-mono" dir="ltr">
                  {b.agency.phone}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-r3 bg-paper p-5 shadow-soft">
            <dl className="dz-sm grid gap-2 text-ink-2">
              <div className="flex justify-between">
                <dt>{t('co_subtotal')}</dt>
                <Dzd amount={num(b.subtotalDA)} className="dz-mono" />
              </div>
              {num(b.insuranceAmountDA) > 0 && (
                <div className="flex justify-between">
                  <dt>{t('car_opt_waiver')}</dt>
                  <Dzd amount={num(b.insuranceAmountDA)} className="dz-mono" />
                </div>
              )}
              <div className="flex justify-between text-ink-4">
                <dt>{t('vat')}</dt>
                <Dzd amount={num(b.taxAmountDA)} className="dz-mono" />
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-between rounded-r2 bg-primary px-4 py-3 text-white">
              <span className="font-semibold">{t('co_total')}</span>
              <Dzd amount={num(b.totalAmountDA)} className="dz-mono text-lg font-bold" />
            </div>
          </div>
          <DepositBox amount={num(b.depositAmountDA)} compact />
        </div>
      </div>

      {CANCELLABLE.includes(b.status) && (
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="danger"
            size="sm"
            disabled={cancel.isPending}
            onClick={() => window.confirm(t('bk_cancel_confirm')) && cancel.mutate()}
          >
            {t('bk_cancel')}
          </Button>
          {cancel.isError && (
            <span className="dz-sm text-status-refused-ink">
              {cancel.error instanceof ApiError ? cancel.error.message : t('err_generic')}
            </span>
          )}
        </div>
      )}
    </Page>
  );
}

export default function BookingPage() {
  return (
    <RequireAuth>
      <BookingView />
    </RequireAuth>
  );
}
