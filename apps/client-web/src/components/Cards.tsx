'use client';

/**
 * Marketplace cards. Search is AGENCY-FIRST (design handoff §3.1): an AgencyCard
 * is the unit of the results list; CarCards only ever render inside an agency.
 */
import Link from 'next/link';
import type { AgencyResult, PublicAgency, PublicCar } from '@/lib/catalog';
import { useLang, type Key } from '@/lib/i18n';
import { Icon } from './Icon';
import { Placeholder } from './Placeholder';
import { VerifiedBadge } from './VerifiedBadge';
import { Dzd } from './Money';

export function Stars({ rating, count }: { rating: number | null; count: number }) {
  const { t } = useLang();
  if (rating == null) return <span className="dz-sm text-ink-4">{t('res_no_reviews')}</span>;
  return (
    <span className="dz-sm inline-flex items-center gap-1 text-ink-2">
      <Icon name="star" size={15} stroke="#C0613A" fill="#C0613A" />
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      <span className="text-ink-4">({count})</span>
    </span>
  );
}

export function AgencyName({ agency, size = 'h3' }: { agency: PublicAgency; size?: 'h3' | 'h1' }) {
  const { pick, t } = useLang();
  return (
    <span
      className={`inline-flex items-center gap-2 ${size === 'h1' ? 'dz-h1' : 'dz-h3'} text-ink`}
    >
      {pick(agency.name, agency.nameAr)}
      {agency.isVerified && (
        <VerifiedBadge size={size === 'h1' ? 20 : 16} title={t('st_verified')} />
      )}
    </span>
  );
}

export function AgencyCard({ agency, href }: { agency: AgencyResult; href: string }) {
  const { t, pick } = useLang();
  return (
    <Link
      href={href}
      className="dz-enter group grid grid-cols-[200px_1fr] gap-5 rounded-r3 bg-paper p-4 shadow-soft transition-shadow hover:shadow-card max-md:grid-cols-1"
    >
      <Placeholder label={`devanture · ${agency.name}`} height={136} />
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <AgencyName agency={agency} />
          <span className="dz-sm shrink-0 text-ink-3">
            {t('res_from')}{' '}
            <Dzd amount={agency.minDailyRateDA} className="font-semibold text-ink" />
            {t('common_per_day')}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Stars rating={agency.rating} count={agency.reviewCount} />
          <span className="dz-sm text-ink-3">
            {agency.completedRentals} {t('res_rentals')}
          </span>
        </div>
        <div className="dz-sm mt-1.5 flex items-center gap-1.5 text-ink-3">
          <Icon name="pin" size={15} />
          {agency.commune} · {pick(agency.wilaya.nameFr, agency.wilaya.nameAr)}
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="dz-sm rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary-deep">
            {agency.availableCars} {t('res_cars_avail')}
          </span>
          <span className="dz-sm inline-flex items-center gap-1 font-semibold text-primary group-hover:underline">
            {t('ag_cars')}
            <Icon name="chevron" size={16} className="dz-flip" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CarSpecs({ car }: { car: PublicCar }) {
  const { t } = useLang();
  return (
    <div className="dz-sm flex flex-wrap gap-x-4 gap-y-1 text-ink-3">
      <span className="inline-flex items-center gap-1.5">
        <Icon name="seat" size={15} />
        {car.seats} {t('car_seats')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="gear" size={15} />
        {car.transmission === 'AUTOMATIC' ? t('car_trans_auto') : t('car_trans_man')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="fuel" size={15} />
        {t(`fuel_${car.fuelType}` as Key)}
      </span>
    </div>
  );
}

export function CarCard({ car, href }: { car: PublicCar; href: string }) {
  const { t, pick } = useLang();
  const name = `${car.make} ${car.model}`;
  return (
    <Link
      href={href}
      className="dz-enter group flex flex-col overflow-hidden rounded-r3 bg-paper shadow-soft transition-shadow hover:shadow-card"
    >
      <Placeholder label={`photo · ${name}`} height={150} radius={0} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="dz-h3 text-ink">{name}</div>
            <div className="dz-xs mt-0.5 text-ink-4">
              {pick(car.category.nameFr, car.category.nameAr)} · {car.year}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <CarSpecs car={car} />
        </div>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <Dzd amount={car.pricing.dailyRateDA} className="dz-h3 text-ink" />
            <span className="dz-sm text-ink-4">{t('common_per_day')}</span>
          </div>
          <span className="dz-xs text-deposit-ink">
            ↩ {t('co_deposit')} <Dzd amount={car.pricing.depositAmountDA} />
          </span>
        </div>
      </div>
    </Link>
  );
}
