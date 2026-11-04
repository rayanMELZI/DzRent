'use client';

/** Team — live staff of my agency (`/agencies/me` → `/agencies/:id/staff`). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth';

export interface ApiMyAgency {
  id: string;
  name: string;
  nameAr: string | null;
  isVerified: boolean;
  _count?: { vehicles: number; staff: number };
}

export interface ApiStaffMember {
  id: string;
  staffRole: 'MANAGER' | 'AGENT' | 'ACCOUNTANT' | 'DISPATCHER';
  isActive: boolean;
  permissions: string[];
  hiredAt: string;
  user: { id: string; firstName: string; lastName: string; phone: string; status: string };
}

export function useMyAgency() {
  const { status, authedRequest } = useAuth();
  return useQuery({
    queryKey: ['my-agency'],
    enabled: status === 'authenticated',
    queryFn: async () => {
      const res = await authedRequest<{ success: true; data: ApiMyAgency | ApiMyAgency[] }>(
        '/agencies/me',
      );
      // Owner gets an array of agencies; staff gets a single one.
      return Array.isArray(res.data) ? (res.data[0] ?? null) : res.data;
    },
  });
}

export function useStaff(agencyId: string | undefined) {
  const { status, authedRequest } = useAuth();
  return useQuery({
    queryKey: ['staff', agencyId],
    enabled: status === 'authenticated' && !!agencyId,
    queryFn: async () => {
      const res = await authedRequest<{ success: true; data: ApiStaffMember[] }>(
        `/agencies/${agencyId}/staff`,
      );
      return res.data;
    },
  });
}

export function useAddStaff(agencyId: string | undefined) {
  const { authedRequest } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      phone: string;
      firstName: string;
      lastName: string;
      staffRole: string;
    }) => authedRequest(`/agencies/${agencyId}/staff`, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', agencyId] }),
  });
}

export function useRemoveStaff(agencyId: string | undefined) {
  const { authedRequest } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) =>
      authedRequest(`/agencies/${agencyId}/staff/${staffId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', agencyId] }),
  });
}
