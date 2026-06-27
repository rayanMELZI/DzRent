'use client';

/**
 * Gates the dashboard behind a valid session. While the session rehydrates it
 * shows a brief splash; unauthenticated visitors are redirected to /login.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="grid min-h-screen place-items-center bg-sand">
        <div className="flex items-center gap-2.5 text-ink-3">
          <span className="dz-pulse grid h-9 w-9 place-items-center rounded-r1 bg-primary text-lg font-bold text-white">
            D
          </span>
          <span className="dz-sm">DzRent…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
