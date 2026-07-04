'use client';

/** In-app notification center — `GET /notifications/me` + mark-all-read. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth';

export interface ApiNotification {
  id: string;
  channel: 'SMS' | 'PUSH' | 'EMAIL';
  templateId: string;
  payload: { body?: string; vars?: Record<string, string | number> } | null;
  isDelivered: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsData {
  items: ApiNotification[];
  total: number;
  unread: number;
  page: number;
}

const KEY = 'notifications';

export function useNotifications() {
  const { status, authedRequest } = useAuth();
  return useQuery({
    queryKey: [KEY],
    enabled: status === 'authenticated',
    queryFn: async () => {
      const res = await authedRequest<{ success: true; data: NotificationsData }>(
        '/notifications/me?limit=20',
      );
      return res.data;
    },
    refetchInterval: 60_000,
  });
}

export function useMarkAllRead() {
  const { authedRequest } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authedRequest('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
