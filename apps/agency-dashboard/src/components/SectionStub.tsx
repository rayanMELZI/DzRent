'use client';

/**
 * Placeholder for dashboard sections not yet implemented. Keeps navigation whole
 * and documents what each screen will contain (per design handoff §9.B) so the
 * next contributor knows exactly what to build here.
 */
import { useLang } from '@/lib/i18n';
import { Icon, type IconName } from '@/components/Icon';
import type { StringKey } from '@dzrent/i18n';

export function SectionStub({
  icon,
  titleKey,
  spec,
}: {
  icon: IconName;
  titleKey: StringKey;
  spec: string;
}) {
  const { t } = useLang();
  return (
    <div className="dz-enter mx-auto max-w-3xl">
      <h1 className="dz-h1 text-ink">{t(titleKey)}</h1>
      <div className="mt-6 flex flex-col items-center gap-4 rounded-r3 border border-dashed border-line-2 bg-paper px-8 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-r3 bg-primary-soft text-primary">
          <Icon name={icon} size={26} stroke="currentColor" />
        </span>
        <p className="dz-body max-w-md text-ink-3">{spec}</p>
        <span className="dz-label rounded-full bg-sand px-3 py-1 text-ink-4">À venir</span>
      </div>
    </div>
  );
}
