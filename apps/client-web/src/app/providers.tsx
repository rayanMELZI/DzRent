'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LangProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { SiteShell } from '@/components/SiteShell';

/** Client-side provider tree shared by every route. */
export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session (state must not leak across SSR requests).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <LangProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <SiteShell>{children}</SiteShell>
        </QueryClientProvider>
      </AuthProvider>
    </LangProvider>
  );
}
