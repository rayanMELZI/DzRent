/**
 * DzRent shared domain types.
 *
 * These describe the data the UI depends on (design handoff §7) and the live
 * client↔agency state contract (§8). They deliberately mirror the prototype's
 * shapes so both surfaces — and the mock store that stands in for the API during
 * early development — speak one language.
 *
 * As backend endpoints come online, API DTOs should converge onto these types
 * (or extend them); keep this file the single source of truth for cross-surface
 * shapes. Enum string unions intentionally match the backend Prisma enums.
 */

// ── Geography ────────────────────────────────────────────────────────────────

/** Algerian planning regions used for logistics and pricing tiers. */
export type RegionCode =
  | 'NORD_CENTRE'
  | 'NORD_EST'
  | 'NORD_OUEST'
  | 'HAUTS_PLATEAUX'
  | 'GRAND_SUD';

export interface Wilaya {
  /** Official Algerian wilaya code as a string, e.g. "16" for Alger. */
  code: string;
  fr: string;
  ar: string;
}

export interface Region {
  id: string;
  fr: string;
  ar: string;
  wilayas: Wilaya[];
}

// ── Vehicle / catalogue ──────────────────────────────────────────────────────

export type CategoryId =
  | 'citadine'
  | 'berline'
  | 'suv'
  | 'utilitaire'
  | 'minivan'
  | 'prestige';

export interface Category {
  id: CategoryId;
  fr: string;
  ar: string;
}

export type Transmission = 'man' | 'auto';
export type Fuel = 'diesel' | 'essence';

export interface Car {
  id: string;
  fr: string;
  ar: string;
  cat: CategoryId;
  year: number;
  seats: number;
  trans: Transmission;
  fuel: Fuel;
  /** Daily rate in DZD. */
  price: number;
  /** Refundable security deposit in DZD. Never summed into a spent total. */
  deposit: number;
}

// ── Agency ───────────────────────────────────────────────────────────────────

export interface Agency {
  id: string;
  fr: string;
  ar: string;
  verified: boolean;
  verifiedOn: string | null;
  rating: number;
  reviews: number;
  commune: { fr: string; ar: string };
  distanceKm: number;
  responseTime: { fr: string; ar: string };
  /** Lifetime completed rentals. */
  completed: number;
  /** Ids of the cars this agency offers (search is agency-first, never car-first). */
  cars: string[];
}

// ── KYC ──────────────────────────────────────────────────────────────────────

export type KycDocId = 'cin' | 'permis' | 'selfie' | 'domicile';

export interface KycDoc {
  id: KycDocId;
  fr: string;
  ar: string;
  why: { fr: string; ar: string };
}

/** Per-document KYC status as surfaced to the UI. */
export type KycStatus = 'approved' | 'pending' | 'refused' | 'none';

export type KycSnapshot = Record<KycDocId, KycStatus>;

// ── Blacklist ────────────────────────────────────────────────────────────────

export type BlacklistReasonId = 'non_return' | 'doc_fraud' | 'payment' | 'damage';
export type Severity = 'high' | 'mid';

export interface BlacklistReason {
  id: BlacklistReasonId;
  fr: string;
  ar: string;
  sev: Severity;
}

export interface BlacklistEntry {
  id: string;
  initials: string;
  name: string;
  phone: string;
  reason: BlacklistReasonId;
  addedBy: string;
  date: string;
  wilaya: string;
}

// ── Bookings / requests (the cross-surface spine) ────────────────────────────

export type RequestStatus = 'pending' | 'approved' | 'refused';

/** One agency's blacklist report with its mandatory justification. */
export interface BlacklistEntryDetail {
  /** Backend BlacklistReason code, e.g. NON_RETURN. */
  reason: string;
  /** Why — required from the reporting agency (anti-abuse rule). */
  description: string;
  agencyName: string;
  /** ISO timestamp. */
  createdAt: string;
}

export interface RequestCustomer {
  name: string;
  phone: string;
  initials: string;
  joined: string;
  rentals: number;
  kyc: KycSnapshot;
  blacklisted: boolean;
  /** Distinct agencies that flagged this person (strict rating signal). */
  blacklistAgencyCount?: number;
  /** The visible reports, each with its justification. */
  blacklistEntries?: BlacklistEntryDetail[];
  /** Risk signals raised by the fraud engine, e.g. "Selfie ne correspond pas à la CIN". */
  riskFlags: { fr: string; ar: string }[];
}

/**
 * A booking request — the unit shared across both surfaces. A client checkout
 * creates one (status `pending`); an agency approve/refuse flips its status,
 * which the client confirmation screen reflects live.
 */
export interface Request {
  id: string;
  status: RequestStatus;
  createdAt: string;
  justNow?: boolean;
  flagged?: boolean;
  customer: RequestCustomer;
  /** Car id. */
  car: string;
  /** Agency id. */
  agency: string;
  from: string;
  to: string;
  days: number;
  total: number;
  deposit: number;
  payMethod?: PaymentMethod;
}

export type PaymentMethod = 'cib' | 'edahabia' | 'cash';

// ── Pricing ──────────────────────────────────────────────────────────────────

/** Add-on unit prices in DZD (design handoff §7). */
export const ADDON_PRICES = {
  childSeat: 1500,
  portableGps: 1000,
  additionalDriver: 2500,
  /** Excess buyback (CDW). */
  cdw: 4000,
} as const;

/** Insurance is charged per rental day. */
export const INSURANCE_PER_DAY_DA = 800;

/** Standard Algerian VAT. */
export const TVA_RATE = 0.19;

export interface PriceBreakdown {
  subtotal: number;
  addons: number;
  insurance: number;
  tva: number;
  total: number;
  /** Separate, never added into `total`. */
  deposit: number;
}

/**
 * Canonical price math (design handoff §7):
 *   subtotal  = price*days + addons
 *   insurance = INSURANCE_PER_DAY_DA * days
 *   tva       = round(subtotal * TVA_RATE)
 *   total     = subtotal + tva + insurance
 * The deposit stays quarantined and is returned alongside, never summed in.
 */
export function computeTotals(params: {
  price: number;
  days: number;
  addons?: number;
  deposit: number;
}): PriceBreakdown {
  const addons = params.addons ?? 0;
  const subtotal = params.price * params.days + addons;
  const insurance = INSURANCE_PER_DAY_DA * params.days;
  const tva = Math.round(subtotal * TVA_RATE);
  const total = subtotal + tva + insurance;
  return { subtotal, addons, insurance, tva, total, deposit: params.deposit };
}

// ── Agency-side vehicle/fleet status (shared status vocabulary) ──────────────

export type VehicleFleetStatus =
  | 'available'
  | 'rented'
  | 'maintenance'
  | 'out_of_service'
  | 'inspection';
