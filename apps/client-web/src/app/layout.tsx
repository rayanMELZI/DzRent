import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'DzRent — Location de voitures auprès d’agences vérifiées',
  description:
    'Louez une voiture partout en Algérie auprès d’agences vérifiées : comparez les agences de votre wilaya, réservez en ligne, caution toujours affichée à part.',
};

export const viewport: Viewport = {
  themeColor: '#0F5249',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // `lang`/`dir` start at the French default and are kept in sync client-side by
  // LangProvider when the user toggles to Arabic (true RTL mirror).
  return (
    <html lang="fr" dir="ltr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
