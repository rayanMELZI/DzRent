'use client';

/** Profile — phone identity, name and language. */
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { Button } from '@/components/Button';
import { RequireAuth } from '@/components/RequireAuth';
import { LangToggle, Page } from '@/components/SiteShell';

function Profile() {
  const { t } = useLang();
  const { user, logout } = useAuth();
  if (!user) return null;
  const rows = [
    { label: t('profile_name'), value: `${user.firstName} ${user.lastName}`.trim() },
    { label: t('profile_phone'), value: user.phone, mono: true },
  ];
  return (
    <Page narrow>
      <h1 className="dz-h1 mb-6 text-ink">{t('profile_title')}</h1>
      <div className="divide-y divide-line rounded-r3 bg-paper shadow-soft">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="dz-sm text-ink-3">{r.label}</span>
            <span className={`text-ink ${r.mono ? 'dz-mono' : 'font-medium'}`} dir="ltr">
              {r.value}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <span className="dz-sm text-ink-3">{t('profile_lang')}</span>
          <LangToggle />
        </div>
      </div>
      <Button variant="ghost" className="mt-5" icon="logout" onClick={() => void logout()}>
        {t('nav_logout')}
      </Button>
    </Page>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );
}
