'use client';

/**
 * Mock store mirroring the design handoff state contract (§8).
 *
 * In production this becomes API calls + realtime (WebSocket/SSE), but the
 * contract is identical: a client checkout pushes a `pending` request into the
 * queue; an agency approve/refuse flips its status. Keeping this shape now means
 * swapping the data source later touches only this file.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { BlacklistEntry, Request, RequestStatus } from '@dzrent/types';
import { SEED_BLACKLIST, SEED_REQUESTS } from './seed';

export type ToastTone = 'ok' | 'err';
export interface Toast {
  id: number;
  msg: string;
  tone: ToastTone;
}

interface StoreValue {
  requests: Request[];
  blacklist: BlacklistEntry[];
  toast: Toast | null;
  pendingCount: number;
  addRequest: (payload: Omit<Request, 'id' | 'status' | 'createdAt' | 'justNow'>) => string;
  setRequestStatus: (id: string, status: RequestStatus) => void;
  addBlacklist: (entry: Omit<BlacklistEntry, 'id'>) => void;
  showToast: (msg: string, tone?: ToastTone) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let seq = 100;
const nextId = () => `req-${++seq}`;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<Request[]>(() => SEED_REQUESTS.map((r) => ({ ...r })));
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>(() =>
    SEED_BLACKLIST.map((b) => ({ ...b })),
  );
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((msg: string, tone: ToastTone = 'ok') => {
    const id = Date.now();
    setToast({ id, msg, tone });
    setTimeout(() => setToast((t) => (t && Date.now() - t.id >= 2400 ? null : t)), 2600);
  }, []);

  const addRequest = useCallback(
    (payload: Omit<Request, 'id' | 'status' | 'createdAt' | 'justNow'>) => {
      const id = nextId();
      const req: Request = { id, status: 'pending', createdAt: "à l'instant", justNow: true, ...payload };
      setRequests((rs) => [req, ...rs]);
      return id;
    },
    [],
  );

  const setRequestStatus = useCallback((id: string, status: RequestStatus) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status, justNow: false } : r)));
  }, []);

  const addBlacklist = useCallback((entry: Omit<BlacklistEntry, 'id'>) => {
    setBlacklist((bl) => [{ id: `bl-${Date.now()}`, ...entry }, ...bl]);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      requests,
      blacklist,
      toast,
      pendingCount: requests.filter((r) => r.status === 'pending').length,
      addRequest,
      setRequestStatus,
      addBlacklist,
      showToast,
    }),
    [requests, blacklist, toast, addRequest, setRequestStatus, addBlacklist, showToast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>');
  return ctx;
}
