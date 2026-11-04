'use client';

/**
 * Inter-agency blacklist — the strict "rating" view (`/blacklist/visible`):
 * one row per person, the count of distinct reporting agencies, and every
 * entry's mandatory justification. Reporting requires phone + justification.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth';

/** Backend BlacklistReason codes → bilingual labels + severity. */
export const REASON_LABELS: Record<string, { fr: string; ar: string; sev: 'high' | 'mid' }> = {
  NON_RETURN: { fr: 'Non-retour du véhicule', ar: 'عدم إرجاع المركبة', sev: 'high' },
  DOCUMENT_FRAUD: { fr: 'Fraude documentaire', ar: 'تزوير الوثائق', sev: 'high' },
  PAYMENT_DEFAULT: { fr: 'Défaut de paiement', ar: 'تخلف عن الدفع', sev: 'mid' },
  VEHICLE_DAMAGE: { fr: 'Dommages non déclarés', ar: 'أضرار غير مصرح بها', sev: 'mid' },
  VIOLENT_BEHAVIOR: { fr: 'Comportement violent', ar: 'سلوك عنيف', sev: 'high' },
  MULTIPLE_FRAUD_SIGNALS: {
    fr: 'Signaux de fraude multiples',
    ar: 'إشارات احتيال متعددة',
    sev: 'high',
  },
  INSURANCE_FRAUD: { fr: "Fraude à l'assurance", ar: 'احتيال على التأمين', sev: 'high' },
};

/** The reasons an agency can pick when reporting (full backend enum). */
export const REPORTABLE_REASONS = Object.keys(REASON_LABELS);

export interface ApiBlacklistPersonEntry {
  id: string;
  reason: string;
  description: string;
  agencyName: string;
  isMine: boolean;
  isShared: boolean;
  createdAt: string;
}

export interface ApiBlacklistPerson {
  user: { id: string; name: string; initials: string; phone: string };
  agencyCount: number;
  entries: ApiBlacklistPersonEntry[];
}

const KEY = 'blacklist-visible';

export function useBlacklistPeople(q: string) {
  const { status, authedRequest } = useAuth();
  const query = q.trim();
  return useQuery({
    queryKey: [KEY, query],
    enabled: status === 'authenticated',
    queryFn: async () => {
      const res = await authedRequest<{
        success: true;
        items: ApiBlacklistPerson[];
        total: number;
      }>(`/blacklist/visible${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      return res;
    },
  });
}

export function useReportBlacklist() {
  const { authedRequest } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { phone: string; reason: string; description: string }) =>
      authedRequest('/blacklist', { method: 'POST', body: { ...input, isShared: true } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
