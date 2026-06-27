import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'DzRent Pro — Tableau de bord agence',
  description:
    "Plateforme de gestion pour agences de location de voitures en Algérie : flotte, réservations, vérification KYC, liste noire inter-agences et suivi GPS.",
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
