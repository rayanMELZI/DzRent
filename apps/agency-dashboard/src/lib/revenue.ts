'use client';

/** Revenue analytics — `GET /bookings/agency/revenue`. */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth';

export interface RevenueWindow {
  revenue: number;
  rentals: number;
  avg: number;
  /** vs the previous window; null when there is no baseline. */
  trendPct: number | null;
}

export interface RevenueData {
  periods: { w: RevenueWindow; m: RevenueWindow; y: RevenueWindow };
  months: { month: string; revenue: number }[];
  byCategory: { slug: string; nameFr: string; nameAr: string; revenue: number }[];
}

export function useAgencyRevenue() {
  const { status, authedRequest } = useAuth();
  return useQuery({
    queryKey: ['agency-revenue'],
    enabled: status === 'authenticated',
    queryFn: async () => {
      const res = await authedRequest<{ success: true; data: RevenueData }>(
        '/bookings/agency/revenue',
      );
      return res.data;
    },
    staleTime: 60_000,
  });
}
