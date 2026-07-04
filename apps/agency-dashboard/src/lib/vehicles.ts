'use client';

/** Fleet — live vehicles: list, create, status transitions (`/vehicles`). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VehicleFleetStatus } from '@dzrent/types';
import { useAuth } from './auth';

// ── Wire types (Prisma Vehicle + list includes) ──────────────────────────────
export type ApiVehicleStatus =
  | 'AVAILABLE'
  | 'RENTED'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE'
  | 'PENDING_INSPECTION';

export interface ApiVehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  status: ApiVehicleStatus;
  seats: number;
  fuelType: string;
  transmission: string;
  currentMileageKm: number;
  dailyRateDA: string | number | null;
  depositAmountDA: string | number;
  hasValidInsurance: boolean;
  hasValidVisite: boolean;
  hasGpsDevice: boolean;
  category: { slug: string; nameFr: string; nameAr: string };
  insurancePolicies: { endDate: string }[];
  documents: { expiresAt: string | null }[];
}

export const STATUS_TO_UI: Record<ApiVehicleStatus, VehicleFleetStatus> = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance',
  OUT_OF_SERVICE: 'out_of_service',
  PENDING_INSPECTION: 'inspection',
};
export const UI_TO_STATUS: Record<VehicleFleetStatus, ApiVehicleStatus> = {
  available: 'AVAILABLE',
  rented: 'RENTED',
  maintenance: 'MAINTENANCE',
  out_of_service: 'OUT_OF_SERVICE',
  inspection: 'PENDING_INSPECTION',
};

/** Days until an ISO date (negative = past). Null when unknown. */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export interface CreateVehicleInput {
  licensePlate: string;
  chassisNumber: string;
  categorySlug: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  transmission: string;
  dailyRateDA?: number;
  depositAmountDA?: number;
  currentMileageKm?: number;
}

const KEY = 'vehicles';

export function useVehicles() {
  const { status, authedRequest } = useAuth();
  return useQuery({
    queryKey: [KEY],
    enabled: status === 'authenticated',
    queryFn: async () => {
      const res = await authedRequest<{ success: true; items: ApiVehicle[]; total: number }>(
        '/vehicles?limit=100',
      );
      return res;
    },
  });
}

export function useCreateVehicle() {
  const { authedRequest } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVehicleInput) =>
      authedRequest('/vehicles', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useSetVehicleStatus() {
  const { authedRequest } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApiVehicleStatus }) =>
      authedRequest(`/vehicles/${id}/status`, { method: 'POST', body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
