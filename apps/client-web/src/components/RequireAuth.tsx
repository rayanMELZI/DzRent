'use client';

/**
 * Gates account pages (trips, documents, profile). Browsing stays public; only
 * these screens need a session. Visitors are sent to /connexion and come back.
 */
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loading } from './SiteShell';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace(`/connexion?next=${encodeURIComponent(path)}`);
  }, [status, router, path]);

  if (status !== 'authenticated') return <Loading />;
  return <>{children}</>;
}
