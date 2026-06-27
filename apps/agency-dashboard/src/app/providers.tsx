'use client';

import { LangProvider } from '@/lib/i18n';
import { StoreProvider } from '@/lib/store';

/** Client-side provider tree shared by every route. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <StoreProvider>{children}</StoreProvider>
    </LangProvider>
  );
}
