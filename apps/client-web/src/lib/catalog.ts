/**
 * Typed access to the public catalogue (`/catalog/*`, no account needed) plus the
 * shapes of the authenticated client endpoints (`/bookings`, `/kyc`).
 */
import { apiRequest } from './api';

// ── Public catalogue ──────────────────────────────────────────────────────────
export interface WilayaRef {
  id: number;
  code: string;
  nameFr: string;
  nameAr: string;
  regionCode: string;
}

export interface CategoryRef {
  slug: string;
  nameFr: string;
  nameAr: string;
  iconKey: string | null;
}

export interface PublicAgency {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  description: string | null;
  descriptionAr: string | null;
  commune: string;
  address: string;
  phone: string;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  wilaya: { id: number; code: string; nameFr: string; nameAr: string };
  rating: number | null;
  reviewCount: number;
  completedRentals: number;
}

export interface AgencyResult extends PublicAgency {
  availableCars: number;
  minDailyRateDA: number;
}

export interface PublicCar {
  id: string;
  agencyId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: 'ESSENCE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'GPL';
  transmission: 'MANUAL' | 'AUTOMATIC';
  seats: number;
  doors: number;
  trunkVolumeLiters: number | null;
  features: string[];
  photoCount: number;
  category: { slug: string; nameFr: string; nameAr: string };
  pricing: {
    dailyRateDA: number;
    weeklyRateDA: number | null;
    monthlyRateDA: number | null;
    depositAmountDA: number;
    taxRatePct: number;
  };
}

export interface AgencyReview {
  id: string;
  overallRating: number;
  comment: string | null;
  commentAr: string | null;
  agencyResponse: string | null;
  createdAt: string;
  author: string;
}

export interface AgencyPage extends PublicAgency {
  cars: PublicCar[];
  reviews: AgencyReview[];
}

export interface CarDetail extends PublicCar {
  agency: PublicAgency;
}

export interface QuoteOptions {
  additionalDrivers?: number;
  hasChildSeat?: boolean;
  hasGpsScreen?: boolean;
  withInsuranceWaiver?: boolean;
}

export interface Quote {
  dailyRateDA: number;
  totalDays: number;
  subtotalDA: number;
  optionsDA: number;
  insuranceAmountDA: number;
  discountDA: number;
  taxRatePct: number;
  taxAmountDA: number;
  depositAmountDA: number;
  totalAmountDA: number;
}

export interface SearchParams {
  wilayaId: number;
  from: string;
  until: string;
  categorySlug?: string;
  model?: string;
}

type Envelope<T> = { success: true; data: T };

function qs(params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const catalog = {
  wilayas: () => apiRequest<Envelope<WilayaRef[]>>('/catalog/wilayas').then((r) => r.data),
  categories: () => apiRequest<Envelope<CategoryRef[]>>('/catalog/categories').then((r) => r.data),
  searchAgencies: (p: SearchParams) =>
    apiRequest<{ items: AgencyResult[]; total: number; models: string[] }>(
      `/catalog/agencies${qs({ ...p })}`,
    ),
  agency: (id: string, period?: { from: string; until: string }) =>
    apiRequest<Envelope<AgencyPage>>(`/catalog/agencies/${id}${qs({ ...period })}`).then(
      (r) => r.data,
    ),
  vehicle: (id: string) =>
    apiRequest<Envelope<CarDetail>>(`/catalog/vehicles/${id}`).then((r) => r.data),
  quote: (body: { vehicleId: string; from: string; until: string } & QuoteOptions) =>
    apiRequest<Envelope<Quote>>('/catalog/quote', { method: 'POST', body }).then((r) => r.data),
};

// ── Authenticated client shapes ───────────────────────────────────────────────
export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED_CLIENT'
  | 'CANCELLED_AGENCY'
  | 'DISPUTED'
  | 'NO_SHOW';

/** Prisma Decimals arrive as strings — always go through `num()`. */
type Money = string | number;

export interface Booking {
  id: string;
  bookingRef: string;
  status: BookingStatus;
  requestedFrom: string;
  requestedUntil: string;
  confirmedFrom: string | null;
  confirmedUntil: string | null;
  totalDays: number;
  dailyRateDA: Money;
  subtotalDA: Money;
  taxAmountDA: Money;
  insuranceAmountDA: Money;
  depositAmountDA: Money;
  totalAmountDA: Money;
  additionalDrivers: number;
  hasChildSeat: boolean;
  hasGpsScreen: boolean;
  cancellationReason: string | null;
  createdAt: string;
  vehicle: { make: string; model: string; licensePlate: string };
  agency: { id?: string; name: string; phone?: string };
}

export const num = (m: Money | null | undefined) => (m == null ? 0 : Number(m));

export type KycDocType = 'CIN' | 'DRIVING_LICENSE' | 'SELFIE' | 'PROOF_OF_ADDRESS' | 'PASSPORT';
export type KycDocStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface KycStatusResponse {
  required: {
    documentType: KycDocType;
    status: KycDocStatus;
    version: number;
    expiresAt: string | null;
    rejectionReason: string | null;
  }[];
  isEligibleForBooking: boolean;
}

/** Booking status → shared status-badge token (design handoff §3.5). */
export const BOOKING_BADGE: Record<
  BookingStatus,
  'approved' | 'pending' | 'refused' | 'none' | 'expiring'
> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  AWAITING_PAYMENT: 'expiring',
  PAID: 'approved',
  ACTIVE: 'approved',
  COMPLETED: 'none',
  CANCELLED_CLIENT: 'none',
  CANCELLED_AGENCY: 'refused',
  DISPUTED: 'refused',
  NO_SHOW: 'refused',
};

export const KYC_BADGE: Record<
  KycDocStatus,
  'approved' | 'pending' | 'refused' | 'none' | 'expiring'
> = {
  NOT_SUBMITTED: 'none',
  PENDING_REVIEW: 'pending',
  APPROVED: 'approved',
  REJECTED: 'refused',
  EXPIRED: 'expiring',
};
