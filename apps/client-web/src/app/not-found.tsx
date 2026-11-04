'use client';

import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { Page } from '@/components/SiteShell';

export default function NotFound() {
  const { t } = useLang();
  return (
    <Page narrow>
      <div className="rounded-r3 bg-paper p-10 text-center shadow-soft">
        <p className="dz-h2 text-ink">{t('err_not_found')}</p>
        <Link
          href="/"
          className="dz-sm mt-4 inline-block font-semibold text-primary hover:underline"
        >
          {t('nav_home')}
        </Link>
      </div>
    </Page>
  );
}
