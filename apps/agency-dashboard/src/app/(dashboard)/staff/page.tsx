'use client';

/**
 * Staff & permissions (design handoff §9.B.7) — live against
 * `/agencies/me` → `/agencies/:id/staff`: owner card, member cards with role,
 * add-member modal (find-or-create by phone) and owner-only removal.
 */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import {
  useAddStaff,
  useMyAgency,
  useRemoveStaff,
  useStaff,
  type ApiStaffMember,
} from '@/lib/staff';
import { ApiError } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Field, inputClass } from '@/components/Field';

const ROLE_LABELS: Record<ApiStaffMember['staffRole'], { fr: string; ar: string }> = {
  MANAGER: { fr: 'Gérant', ar: 'المسير' },
  AGENT: { fr: 'Agent comptoir', ar: 'موظف استقبال' },
  ACCOUNTANT: { fr: 'Comptable', ar: 'محاسب' },
  DISPATCHER: { fr: 'Dispatcheur (GPS)', ar: 'مسؤول التتبع' },
};

const initialsOf = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '·';

export default function StaffScreen() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { showToast } = useStore();
  const [adding, setAdding] = useState(false);

  const agency = useMyAgency();
  const agencyId = agency.data?.id;
  const staff = useStaff(agencyId);
  const removeStaff = useRemoveStaff(agencyId);

  const members = (staff.data ?? []).filter((m) => m.isActive);
  const isOwner = user?.role === 'AGENCY_OWNER';
  const loading = agency.isPending || staff.isPending;

  const remove = (m: ApiStaffMember) => {
    removeStaff.mutate(m.id, {
      onSuccess: () => showToast(lang === 'ar' ? 'أُزيل العضو' : 'Membre retiré'),
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : t('common_save_error'), 'err'),
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <p className="dz-sm m-0 text-ink-3">{agency.data?.name ?? ''}</p>
        {isOwner && (
          <Button size="sm" icon="plus" onClick={() => setAdding(true)}>
            {lang === 'ar' ? 'إضافة عضو' : 'Ajouter un membre'}
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col gap-2.5">
          {[0, 1].map((i) => (
            <div key={i} className="dz-pulse h-20 rounded-r3 bg-paper shadow-soft" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-2.5">
          {/* Owner card — the live session identity */}
          {user && isOwner && (
            <div className="flex items-center gap-3.5 rounded-r3 bg-paper p-4 shadow-soft">
              <div className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-primary text-[15px] font-semibold text-white">
                {initialsOf(user.firstName, user.lastName)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="dz-h3 text-[15px] text-ink">
                    {`${user.firstName} ${user.lastName}`.trim() || user.phone}
                  </span>
                  <span className="dz-label rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary-deep">
                    {lang === 'ar' ? 'مالك' : 'OWNER'}
                  </span>
                </div>
                <div className="dz-mono dz-sm mt-0.5 text-ink-3" dir="ltr">
                  {user.phone}
                </div>
              </div>
            </div>
          )}

          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3.5 rounded-r3 bg-paper p-4 shadow-soft"
            >
              <div className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-primary-soft text-[15px] font-semibold text-primary-deep">
                {initialsOf(m.user.firstName, m.user.lastName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="dz-h3 truncate text-[15px] text-ink">
                    {`${m.user.firstName} ${m.user.lastName}`.trim()}
                  </span>
                  {m.user.status === 'PENDING_VERIFICATION' && (
                    <span className="dz-label rounded-full bg-status-pending-bg px-1.5 py-0.5 text-[10px] text-status-pending-ink">
                      {lang === 'ar' ? 'بانتظار OTP' : 'OTP en attente'}
                    </span>
                  )}
                </div>
                <div className="dz-sm mt-0.5 text-ink-3">{ROLE_LABELS[m.staffRole][lang]}</div>
                <div className="dz-mono dz-xs mt-0.5 text-ink-4" dir="ltr">
                  {m.user.phone}
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => remove(m)}
                  disabled={removeStaff.isPending}
                  className="grid h-9 w-9 place-items-center rounded-r2 text-ink-3 hover:bg-status-refused-bg hover:text-status-refused-ink"
                  aria-label="retirer"
                >
                  <Icon name="x" size={17} stroke="currentColor" />
                </button>
              )}
            </div>
          ))}

          {members.length === 0 && (
            <div className="dz-body rounded-r3 bg-paper p-8 text-center text-ink-4 shadow-soft">
              {lang === 'ar' ? 'لا أعضاء بعد.' : 'Aucun membre pour le moment.'}
            </div>
          )}
        </div>
      )}

      {adding && agencyId && (
        <AddStaffModal
          agencyId={agencyId}
          onClose={() => setAdding(false)}
          onAdded={() => {
            showToast(lang === 'ar' ? 'أُضيف العضو' : 'Membre ajouté');
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function AddStaffModal({
  agencyId,
  onClose,
  onAdded,
}: {
  agencyId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { t, lang } = useLang();
  const addStaff = useAddStaff(agencyId);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: '', firstName: '', lastName: '', staffRole: 'AGENT' });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmit = form.phone.trim().length >= 9 && form.firstName.trim() && form.lastName.trim();

  const submit = () => {
    setError(null);
    addStaff.mutate(
      {
        phone: form.phone.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        staffRole: form.staffRole,
      },
      {
        onSuccess: onAdded,
        onError: (err) => setError(err instanceof ApiError ? err.message : t('common_save_error')),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center">
      <div className="dz-pop absolute inset-0 bg-[rgba(20,24,22,.5)]" onClick={onClose} />
      <div className="dz-pop relative w-[420px] rounded-r3 bg-paper p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-r2 bg-primary-soft">
            <Icon name="staff" size={20} stroke="#0B3F38" />
          </div>
          <h3 className="dz-h2 text-ink">{lang === 'ar' ? 'إضافة عضو' : 'Ajouter un membre'}</h3>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === 'ar' ? 'الاسم' : 'Prénom'}>
              <input
                value={form.firstName}
                onChange={(e) => set('firstName')(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label={lang === 'ar' ? 'اللقب' : 'Nom'}>
              <input
                value={form.lastName}
                onChange={(e) => set('lastName')(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label={t('otp_title')}>
            <input
              value={form.phone}
              onChange={(e) => set('phone')(e.target.value)}
              className={`${inputClass} dz-mono`}
              placeholder="+213 6XX XX XX XX"
              dir="ltr"
            />
          </Field>
          <Field label={lang === 'ar' ? 'الدور' : 'Rôle'}>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ROLE_LABELS) as ApiStaffMember['staffRole'][]).map((r) => (
                <button
                  key={r}
                  onClick={() => set('staffRole')(r)}
                  className={`rounded-r2 px-3 py-2 text-[13px] font-semibold ${
                    form.staffRole === r
                      ? 'bg-primary text-white'
                      : 'bg-sand text-ink-2 hover:text-ink'
                  }`}
                >
                  {ROLE_LABELS[r][lang]}
                </button>
              ))}
            </div>
          </Field>
          {error && <p className="dz-sm m-0 text-status-refused-ink">{error}</p>}
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button
            variant="ghost"
            full
            onClick={onClose}
            className="shadow-[inset_0_0_0_1px_#DDD7CA]"
          >
            {t('common_cancel')}
          </Button>
          <Button
            variant="primary"
            full
            icon="plus"
            onClick={submit}
            disabled={!canSubmit || addStaff.isPending}
          >
            {lang === 'ar' ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  );
}
