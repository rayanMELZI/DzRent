'use client';

/**
 * Agency dashboard sidebar. In RTL the entire shell flips (sidebar to the right)
 * via `dir` on the shell root + flex order following document direction — no
 * hardcoded left/right (design handoff §10.1).
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { useAgencyRequests } from '@/lib/requests';
import { useAuth } from '@/lib/auth';
import { Icon, type IconName } from '@/components/Icon';
import type { StringKey } from '@dzrent/i18n';

interface NavItem {
  href: string;
  icon: IconName;
  key: StringKey;
}

const NAV: NavItem[] = [
  { href: '/', icon: 'dashboard', key: 'dash_nav_home' },
  { href: '/fleet', icon: 'fleet', key: 'dash_nav_fleet' },
  { href: '/requests', icon: 'requests', key: 'dash_nav_requests' },
  { href: '/blacklist', icon: 'blacklist', key: 'dash_nav_blacklist' },
  { href: '/map', icon: 'map', key: 'dash_nav_map' },
  { href: '/revenue', icon: 'revenue', key: 'dash_nav_revenue' },
  { href: '/staff', icon: 'staff', key: 'dash_nav_staff' },
];

export function Sidebar() {
  const { t } = useLang();
  // Shares the queue query cache: the badge reacts live to approve/refuse.
  const { data } = useAgencyRequests('pending');
  const pendingCount = data?.counts.pending ?? 0;
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-primary text-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-8 w-8 place-items-center rounded-r1 bg-white/15 text-lg font-bold">
          D
        </div>
        <span className="text-lg font-bold tracking-tight">DzRent</span>
        <span className="dz-label ms-1 rounded bg-white/10 px-1.5 py-0.5 text-white/70">Pro</span>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const showBadge = item.href === '/requests' && pendingCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-r2 px-3 py-2.5 text-[14px] font-medium transition-colors ${
                active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon name={item.icon} size={19} stroke="currentColor" />
              <span>{t(item.key)}</span>
              {showBadge && (
                <span className="dz-tnum ms-auto inline-grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1.5 text-[11px] font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="m-3 flex items-center gap-3 rounded-r2 px-3 py-2.5 text-[14px] font-medium text-white/70 hover:bg-white/10 hover:text-white"
      >
        <Icon name="logout" size={19} className="dz-flip" />
        <span>{t('nav_logout')}</span>
      </button>
    </aside>
  );
}
