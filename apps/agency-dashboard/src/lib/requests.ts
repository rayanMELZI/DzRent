'use client';

/**
 * Requests queue — live server state (replaces the seed reads for this screen).
 *
 * `GET /bookings/agency/requests` returns UI-ready items (KYC snapshot, risk
 * flags, blacklist presence aggregated server-side); this module adapts them
 * to the design-handoff `Request` shape (dates → localized strings, risk-flag
 * codes → FR/AR labels) and exposes typed TanStack Query hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Lang } from '@dzrent/i18n';
import type { BlacklistEntryDetail, KycSnapshot, Request, RequestStatus } from '@dzrent/types';
import { useAuth } from './auth';
import { dayMonth, monthYear, relativeFromNow } from './dates';

// ── Wire types (mirror apps/backend/src/bookings/requests.mapper.ts) ─────────
export interface ApiAgencyRequest {
  id: string;
  bookingRef: string;
  status: RequestStatus;
  bookingStatus: string;
  createdAt: string;
  flagged: boolean;
  customer: {
    name: string;
    phone: string;
    initials: string;
    joinedAt: string;
    rentals: number;
    kyc: KycSnapshot;
    blacklisted: boolean;
    blacklistAgencyCount: number;
    blacklistEntries: BlacklistEntryDetail[];
    riskFlags: string[];
  };
  vehicle: { name: string; plate: string };
  from: string;
  to: string;
  days: number;
  total: number;
  deposit: number;
}

export interface AgencyRequestsData {
  items: ApiAgencyRequest[];
  counts: Record<RequestStatus, number>;
  total: number;
  page: number;
}

// ── Risk-flag codes → bilingual labels (FraudSignalType vocabulary) ──────────
const RISK_FLAG_LABELS: Record<string, { fr: string; ar: string }> = {
  MULTIPLE_CONCURRENT_BOOKINGS: {
    fr: 'Réservations simultanées multiples',
    ar: 'حجوزات متزامنة متعددة',
  },
  VELOCITY_ABUSE: { fr: 'Fréquence de réservation anormale', ar: 'وتيرة حجز غير طبيعية' },
  CIN_DUPLICATE: { fr: 'CIN utilisée sur plusieurs comptes', ar: 'بطاقة تعريف مستعملة في حسابات متعددة' },
  DOCUMENT_MISMATCH: { fr: 'Incohérence entre les documents', ar: 'تعارض بين الوثائق' },
  SUSPICIOUS_GPS_PATTERN: { fr: 'Trajet GPS suspect', ar: 'مسار GPS مريب' },
};

const JUST_NOW_WINDOW_MS = 10 * 60_000;

/** API item → the `Request` shape the queue components render. */
export function toUiRequest(item: ApiAgencyRequest, lang: Lang): Request {
  const c = item.customer;
  return {
    id: item.id,
    status: item.status,
    createdAt: relativeFromNow(item.createdAt, lang),
    justNow:
      item.status === 'pending' &&
      Date.now() - new Date(item.createdAt).getTime() < JUST_NOW_WINDOW_MS,
    flagged: item.flagged || undefined,
    customer: {
      name: c.name,
      phone: c.phone,
      initials: c.initials,
      joined: monthYear(c.joinedAt, lang),
      rentals: c.rentals,
      kyc: c.kyc,
      blacklisted: c.blacklisted,
      blacklistAgencyCount: c.blacklistAgencyCount,
      blacklistEntries: c.blacklistEntries,
      riskFlags: c.riskFlags.map((code) => RISK_FLAG_LABELS[code] ?? { fr: code, ar: code }),
    },
    // The components fall back to the raw string when the id isn't in the
    // seed catalogue — so the live vehicle display name renders directly.
    car: item.vehicle.name,
    agency: '',
    from: dayMonth(item.from, lang),
    to: dayMonth(item.to, lang),
    days: item.days,
    total: item.total,
    deposit: item.deposit,
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
const QUEUE_KEY = 'agency-requests';

export function useAgencyRequests(view: RequestStatus) {
  const { status, authedRequest } = useAuth();
  return useQuery({
    queryKey: [QUEUE_KEY, view],
    enabled: status === 'authenticated',
    queryFn: async () => {
      const res = await authedRequest<{ success: true; data: AgencyRequestsData }>(
        `/bookings/agency/requests?view=${view}&limit=50`,
      );
      return res.data;
    },
    // Cheap freshness for the queue until the realtime bridge (Phase D) lands.
    refetchInterval: 30_000,
  });
}

export function useRequestDecision() {
  const { authedRequest } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) =>
      action === 'approve'
        ? authedRequest(`/bookings/${id}/approve`, { method: 'POST' })
        : authedRequest(`/bookings/${id}/reject`, { method: 'POST', body: { reason: reason ?? '—' } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUEUE_KEY] }),
  });
}
