/**
 * Low-level client for the DzRent backend API.
 *
 * Thin wrapper over fetch: prefixes the configured base URL, sends/receives JSON,
 * attaches a bearer token when provided, and normalises errors into `ApiError`.
 * Token lifecycle (storage, refresh-on-401) lives in the auth provider so this
 * stays dependency-free and usable from anywhere.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Bearer token to attach (access token for most calls, refresh for refresh/logout). */
  token?: string;
  signal?: AbortSignal;
}

/** Extract the human message from the backend's error envelope, if present. */
function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.message === 'string') return b.message;
    if (Array.isArray(b.message) && typeof b.message[0] === 'string') return b.message[0];
    if (b.error && typeof b.error === 'object') {
      const e = b.error as Record<string, unknown>;
      if (typeof e.message === 'string') return e.message;
    }
  }
  return fallback;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez votre connexion.');
  }

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    throw new ApiError(res.status, messageFrom(data, `Erreur ${res.status}`), data);
  }
  return data as T;
}

/** Machine-readable backend error code (`{ error: 'KYC_INCOMPLETE', … }`), if any. */
export function errorCode(err: unknown): string | null {
  if (err instanceof ApiError && err.body && typeof err.body === 'object') {
    const code = (err.body as Record<string, unknown>).error;
    return typeof code === 'string' ? code : null;
  }
  return null;
}
