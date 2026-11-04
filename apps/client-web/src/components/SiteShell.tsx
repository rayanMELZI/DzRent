'use client';

/**
 * Desktop site chrome: top bar (logo, search, account, FR/AR toggle) + footer.
 * Uses logical properties only, so Arabic mirrors the whole layout.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Lang } from '@dzrent/i18n';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { Icon, type IconName } from './Icon';

const AGENCY_URL = process.env.NEXT_PUBLIC_AGENCY_URL ?? 'https://dzrent-agence.rayanemelzi.dev';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-r1 bg-primary text-lg font-bold text-white">
        D
      </span>
      <span className="text-lg font-bold tracking-tight text-ink">DzRent</span>
    </Link>
  );
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  const langs: { id: Lang; label: string }[] = [
    { id: 'fr', label: 'FR' },
    { id: 'ar', label: 'العربية' },
  ];
  return (
    <div className="flex gap-0.5 rounded-r2 bg-sand p-0.5">
      {langs.map((l) => (
        <button
          key={l.id}
          onClick={() => setLang(l.id)}
          className={`rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            lang === l.id ? 'bg-primary text-white' : 'text-ink-3 hover:text-ink'
          }`}
          style={{ fontFamily: l.id === 'ar' ? 'var(--font-arabic)' : undefined }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  const path = usePathname();
  const active = path === href || (href !== '/' && path.startsWith(href));
  return (
    <Link
      href={href}
      className={`dz-sm inline-flex items-center gap-1.5 rounded-r2 px-3 py-2 font-medium transition-colors ${
        active ? 'bg-primary-soft text-primary-deep' : 'text-ink-2 hover:bg-sand'
      }`}
    >
      <Icon name={icon} size={17} />
      {label}
    </Link>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const { status, user, logout } = useAuth();
  const authed = status === 'authenticated';

  return (
    <div className="flex min-h-screen flex-col bg-sand">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <Logo />
          <nav className="flex items-center gap-1">
            <NavLink href="/agences" icon="search" label={t('nav_search')} />
            {authed && (
              <>
                <NavLink href="/reservations" icon="trips" label={t('nav_trips')} />
                <NavLink href="/documents" icon="doc" label={t('nav_docs')} />
              </>
            )}
          </nav>
          <div className="ms-auto flex items-center gap-3">
            <a
              href={AGENCY_URL}
              className="dz-sm text-ink-3 hover:text-ink max-md:hidden"
              rel="noopener"
            >
              {t('nav_for_agencies')}
            </a>
            <LangToggle />
            {authed ? (
              <div className="flex items-center gap-1">
                <Link
                  href="/profil"
                  className="dz-sm inline-flex items-center gap-2 rounded-r2 px-2.5 py-1.5 font-medium text-ink hover:bg-sand"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-[13px] font-bold text-primary-deep">
                    {(user?.firstName?.[0] ?? 'D').toUpperCase()}
                  </span>
                  <span className="max-md:hidden">{user?.firstName}</span>
                </Link>
                <button
                  onClick={() => void logout()}
                  className="grid h-9 w-9 place-items-center rounded-r2 text-ink-3 hover:bg-sand hover:text-ink"
                  title={t('nav_logout')}
                  aria-label={t('nav_logout')}
                >
                  <Icon name="logout" size={18} className="dz-flip" />
                </button>
              </div>
            ) : (
              <Link
                href="/connexion"
                className="dz-sm inline-flex min-h-[38px] items-center rounded-r2 bg-primary px-4 font-semibold text-white hover:bg-primary-deep"
              >
                {t('nav_login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-6 max-md:flex-col max-md:items-start">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="dz-sm text-ink-4">{t('footer_trust')}</span>
          </div>
          <span className="dz-xs text-ink-4">
            © {new Date().getFullYear()} DzRent. {t('footer_rights')}
          </span>
        </div>
      </footer>
    </div>
  );
}

/** Centered page container used by every screen. */
export function Page({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={`mx-auto px-6 py-8 ${narrow ? 'max-w-3xl' : 'max-w-6xl'}`}>{children}</div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="dz-sm mb-4 inline-flex items-center gap-1 text-ink-3 hover:text-ink"
    >
      <Icon name="chevron" size={16} className="rotate-180 dz-flip" />
      {label}
    </Link>
  );
}

export function Loading() {
  const { t } = useLang();
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="flex items-center gap-2.5 text-ink-3">
        <span className="dz-pulse grid h-9 w-9 place-items-center rounded-r1 bg-primary text-lg font-bold text-white">
          D
        </span>
        <span className="dz-sm">{t('common_loading')}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLang();
  return (
    <div className="rounded-r3 bg-paper p-8 text-center shadow-soft">
      <Icon name="alert" size={28} stroke="#9C352B" className="mx-auto" />
      <p className="dz-body mt-3 text-ink-2">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="dz-sm mt-3 font-semibold text-primary hover:underline">
          {t('common_retry')}
        </button>
      )}
    </div>
  );
}
