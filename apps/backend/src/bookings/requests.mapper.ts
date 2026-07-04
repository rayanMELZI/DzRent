import { BookingStatus, KycDocumentType, KycStatus } from '@prisma/client';

/**
 * Agency "requests queue" read model.
 *
 * The dashboard queue speaks the design-handoff vocabulary (§8): three views
 * (pending / approved / refused), a per-document KYC snapshot, risk flags and
 * blacklist presence. This mapper owns the translation from Prisma rows to
 * that contract so the HTTP layer returns UI-ready data in one round-trip.
 */

/** Dashboard view → the backend statuses it aggregates. */
export const REQUEST_VIEWS = {
  pending: [BookingStatus.PENDING],
  approved: [
    BookingStatus.APPROVED,
    BookingStatus.AWAITING_PAYMENT,
    BookingStatus.PAID,
    BookingStatus.ACTIVE,
    BookingStatus.COMPLETED,
  ],
  refused: [BookingStatus.CANCELLED_AGENCY],
} as const;

export type RequestView = keyof typeof REQUEST_VIEWS;

export function toRequestView(raw?: string): RequestView {
  return raw === 'approved' || raw === 'refused' ? raw : 'pending';
}

/** Which view a raw status belongs to (null = not surfaced in the queue). */
export function viewOfStatus(status: BookingStatus): RequestView | null {
  for (const view of Object.keys(REQUEST_VIEWS) as RequestView[]) {
    if ((REQUEST_VIEWS[view] as readonly BookingStatus[]).includes(status)) return view;
  }
  return null;
}

// ── KYC snapshot (UI vocabulary: approved | pending | refused | none) ────────
export type UiKycStatus = 'approved' | 'pending' | 'refused' | 'none';
export type UiKycDocId = 'cin' | 'permis' | 'selfie' | 'domicile';

const KYC_DOC_IDS: Partial<Record<KycDocumentType, UiKycDocId>> = {
  [KycDocumentType.CIN]: 'cin',
  [KycDocumentType.DRIVING_LICENSE]: 'permis',
  [KycDocumentType.SELFIE]: 'selfie',
  [KycDocumentType.PROOF_OF_ADDRESS]: 'domicile',
};

function uiKycStatus(doc: { status: KycStatus; expiresAt: Date | null } | undefined, now: Date): UiKycStatus {
  if (!doc) return 'none';
  // An APPROVED document past its validity date is no longer trustworthy.
  if (doc.status === KycStatus.APPROVED) {
    return doc.expiresAt && doc.expiresAt < now ? 'refused' : 'approved';
  }
  if (doc.status === KycStatus.PENDING_REVIEW) return 'pending';
  if (doc.status === KycStatus.REJECTED || doc.status === KycStatus.EXPIRED) return 'refused';
  return 'none'; // NOT_SUBMITTED
}

/** Latest-version doc per UI doc id → the 4-slot snapshot the queue renders. */
export function buildKycSnapshot(
  docs: { documentType: KycDocumentType; status: KycStatus; expiresAt: Date | null }[],
  now: Date,
): Record<UiKycDocId, UiKycStatus> {
  const latest = new Map<UiKycDocId, { status: KycStatus; expiresAt: Date | null }>();
  for (const d of docs) {
    const id = KYC_DOC_IDS[d.documentType];
    if (id && !latest.has(id)) latest.set(id, d); // docs are ordered version desc
  }
  return {
    cin: uiKycStatus(latest.get('cin'), now),
    permis: uiKycStatus(latest.get('permis'), now),
    selfie: uiKycStatus(latest.get('selfie'), now),
    domicile: uiKycStatus(latest.get('domicile'), now),
  };
}

export function initialsOf(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '·';
}

// ── Blacklist detail (the strict "rating" — every entry carries its proof) ───
export interface BlacklistEntryDetail {
  reason: string; // BlacklistReason enum code
  description: string; // mandatory justification from the reporting agency
  agencyName: string;
  createdAt: string; // ISO
}

// ── The wire item ─────────────────────────────────────────────────────────────
export interface AgencyRequestItem {
  id: string;
  bookingRef: string;
  /** UI view this booking belongs to. */
  status: RequestView;
  /** Raw machine status, for detail surfaces that need the full state. */
  bookingStatus: BookingStatus;
  createdAt: string; // ISO — the client formats relative time per locale
  flagged: boolean;
  customer: {
    name: string;
    phone: string;
    initials: string;
    joinedAt: string; // ISO
    /** Completed rentals across the platform (trust signal). */
    rentals: number;
    kyc: Record<UiKycDocId, UiKycStatus>;
    blacklisted: boolean;
    /** How many distinct agencies flagged this person (the strict rating). */
    blacklistAgencyCount: number;
    /** Each visible entry with its mandatory justification. */
    blacklistEntries: BlacklistEntryDetail[];
    /** Unresolved fraud-signal codes; the client maps them to FR/AR labels. */
    riskFlags: string[];
  };
  vehicle: { name: string; plate: string };
  from: string; // ISO — confirmed window when set, requested otherwise
  to: string;
  days: number;
  total: number;
  deposit: number;
}

export interface AgencyRequestRow {
  id: string;
  bookingRef: string;
  status: BookingStatus;
  createdAt: Date;
  requestedFrom: Date;
  requestedUntil: Date;
  confirmedFrom: Date | null;
  confirmedUntil: Date | null;
  totalDays: number;
  totalAmountDA: unknown; // Prisma.Decimal
  depositAmountDA: unknown;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    createdAt: Date;
    riskFlags: unknown; // Json — string[] maintained by FraudService
  };
  vehicle: { make: string; model: string; licensePlate: string };
}

export function buildAgencyRequestItem(
  row: AgencyRequestRow,
  deps: {
    kycDocs: { documentType: KycDocumentType; status: KycStatus; expiresAt: Date | null }[];
    blacklistEntries: BlacklistEntryDetail[];
    rentals: number;
    now: Date;
  },
): AgencyRequestItem {
  const riskFlags = Array.isArray(row.client.riskFlags) ? (row.client.riskFlags as string[]) : [];
  const blacklisted = deps.blacklistEntries.length > 0;
  const blacklistAgencyCount = new Set(deps.blacklistEntries.map((e) => e.agencyName)).size;
  return {
    id: row.id,
    bookingRef: row.bookingRef,
    status: viewOfStatus(row.status) ?? 'pending',
    bookingStatus: row.status,
    createdAt: row.createdAt.toISOString(),
    flagged: blacklisted || riskFlags.length > 0,
    customer: {
      name: `${row.client.firstName} ${row.client.lastName}`.trim(),
      phone: row.client.phone,
      initials: initialsOf(row.client.firstName, row.client.lastName),
      joinedAt: row.client.createdAt.toISOString(),
      rentals: deps.rentals,
      kyc: buildKycSnapshot(deps.kycDocs, deps.now),
      blacklisted,
      blacklistAgencyCount,
      blacklistEntries: deps.blacklistEntries,
      riskFlags,
    },
    vehicle: { name: `${row.vehicle.make} ${row.vehicle.model}`, plate: row.vehicle.licensePlate },
    from: (row.confirmedFrom ?? row.requestedFrom).toISOString(),
    to: (row.confirmedUntil ?? row.requestedUntil).toISOString(),
    days: row.totalDays,
    total: Number(row.totalAmountDA),
    deposit: Number(row.depositAmountDA),
  };
}
