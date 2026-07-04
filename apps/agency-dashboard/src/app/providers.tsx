'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LangProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { StoreProvider } from '@/lib/store';

/** Client-side provider tree shared by every route. */
export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session (state must not leak across SSR requests).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1 },
        },
      }),
  );

  return (
    <LangProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <StoreProvider>{children}</StoreProvider>
        </QueryClientProvider>
      </AuthProvider>
    </LangProvider>
  );
}
