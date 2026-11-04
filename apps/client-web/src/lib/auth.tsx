'use client';

/**
 * Authentication provider for the client website.
 *
 * Phone-first OTP against the backend (`/auth/*`): request a code, verify it for a
 * JWT access+refresh pair, persist them, and expose the session. Access tokens are
 * short-lived (15 min); `authedRequest` transparently refreshes once on a 401 using
 * the rotating refresh token.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, ApiError } from './api';

export interface AuthUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'AGENCY_OWNER' | 'AGENCY_STAFF' | 'ADMIN';
  locale: 'fr' | 'ar';
  isNewUser?: boolean;
}

interface VerifyResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthValue {
  status: Status;
  user: AuthUser | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (input: {
    phone: string;
    otp: string;
    firstName?: string;
    lastName?: string;
    locale?: 'fr' | 'ar';
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Authenticated request that refreshes the access token once on a 401. */
  authedRequest: <T>(
    path: string,
    options?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown },
  ) => Promise<T>;
}

const STORAGE = {
  access: 'dzrent.client.accessToken',
  refresh: 'dzrent.client.refreshToken',
  user: 'dzrent.client.user',
} as const;

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const persist = useCallback((tokens: VerifyResponse | null) => {
    if (typeof window === 'undefined') return;
    if (tokens) {
      localStorage.setItem(STORAGE.access, tokens.accessToken);
      localStorage.setItem(STORAGE.refresh, tokens.refreshToken);
      localStorage.setItem(STORAGE.user, JSON.stringify(tokens.user));
    } else {
      localStorage.removeItem(STORAGE.access);
      localStorage.removeItem(STORAGE.refresh);
      localStorage.removeItem(STORAGE.user);
    }
  }, []);

  // Rehydrate from storage on first load.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE.user);
    const access = localStorage.getItem(STORAGE.access);
    if (raw && access) {
      try {
        setUser(JSON.parse(raw) as AuthUser);
        setStatus('authenticated');
        return;
      } catch {
        persist(null);
      }
    }
    setStatus('unauthenticated');
  }, [persist]);

  const requestOtp = useCallback(async (phone: string) => {
    await apiRequest('/auth/request-otp', { method: 'POST', body: { phone } });
  }, []);

  const verifyOtp = useCallback<AuthValue['verifyOtp']>(
    async (input) => {
      const res = await apiRequest<{ success: true } & VerifyResponse>('/auth/verify-otp', {
        method: 'POST',
        body: input,
      });
      persist(res);
      setUser(res.user);
      setStatus('authenticated');
      return res.user;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem(STORAGE.refresh) : null;
    if (refresh) {
      await apiRequest('/auth/logout', { method: 'POST', token: refresh }).catch(() => undefined);
    }
    persist(null);
    setUser(null);
    setStatus('unauthenticated');
  }, [persist]);

  const refreshTokens = useCallback(async (): Promise<string | null> => {
    const refresh = localStorage.getItem(STORAGE.refresh);
    if (!refresh) return null;
    try {
      const res = await apiRequest<{ success: true } & VerifyResponse>('/auth/refresh', {
        method: 'POST',
        token: refresh,
      });
      persist(res);
      setUser(res.user);
      return res.accessToken;
    } catch {
      persist(null);
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, [persist]);

  const authedRequest = useCallback<AuthValue['authedRequest']>(
    async (path, options = {}) => {
      const access = localStorage.getItem(STORAGE.access);
      try {
        return await apiRequest(path, { ...options, token: access ?? undefined });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          const fresh = await refreshTokens();
          if (fresh) return apiRequest(path, { ...options, token: fresh });
        }
        throw err;
      }
    },
    [refreshTokens],
  );

  const value = useMemo<AuthValue>(
    () => ({ status, user, requestOtp, verifyOtp, logout, authedRequest }),
    [status, user, requestOtp, verifyOtp, logout, authedRequest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
