'use client';

/**
 * Staff & permissions (design handoff §9.B.7): member cards with role, an OWNER
 * tag, and permission chips.
 */
import { useLang } from '@/lib/i18n';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';

type PermKey = 'fleet' | 'requests' | 'blacklist' | 'revenue' | 'map';

interface StaffMember {
  initials: string;
  name: string;
  role: { fr: string; ar: string };
  perms: PermKey[];
  owner?: boolean;
}

const STAFF: StaffMember[] = [
  { initials: 'SK', name: 'Sofiane Kaci', role: { fr: 'Gérant', ar: 'المسير' }, perms: ['fleet', 'requests', 'blacklist', 'revenue'], owner: true },
  { initials: 'NB', name: 'Nawel Brahimi', role: { fr: 'Agent comptoir', ar: 'موظف استقبال' }, perms: ['requests', 'fleet'] },
  { initials: 'YH', name: 'Yanis Haddad', role: { fr: 'Responsable flotte', ar: 'مسؤول الأسطول' }, perms: ['fleet', 'map'] },
];

const PERM_LABELS: Record<PermKey, { fr: string; ar: string }> = {
  fleet: { fr: 'Flotte', ar: 'الأسطول' },
  requests: { fr: 'Demandes', ar: 'الطلبات' },
  blacklist: { fr: 'Liste noire', ar: 'القائمة' },
  revenue: { fr: 'Revenus', ar: 'الإيرادات' },
  map: { fr: 'Carte', ar: 'الخريطة' },
};

export default function StaffScreen() {
  const { lang } = useLang();
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3.5 flex justify-end">
        <Button size="sm" icon="plus">
          {lang === 'ar' ? 'إضافة عضو' : 'Ajouter un membre'}
        </Button>
      </div>
      <div className="flex flex-col gap-2.5">
        {STAFF.map((s) => (
          <div key={s.initials} className="flex items-center gap-3.5 rounded-r3 bg-paper p-4 shadow-soft">
            <div className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-primary text-[15px] font-semibold text-white">
              {s.initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="dz-h3 text-[15px] text-ink">{s.name}</span>
                {s.owner && (
                  <span className="dz-label rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary-deep">
                    {lang === 'ar' ? 'مالك' : 'OWNER'}
                  </span>
                )}
              </div>
              <div className="dz-sm mt-0.5 text-ink-3">{s.role[lang]}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.perms.map((p) => (
                  <span key={p} className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-medium text-ink-2">
                    {PERM_LABELS[p][lang]}
                  </span>
                ))}
              </div>
            </div>
            <Icon name="chevron" size={18} stroke="#8A8F88" className="dz-flip" />
          </div>
        ))}
      </div>
    </div>
  );
}
