'use client';

/** "Signaler un client" modal — name, phone, reason (with severity). */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { agencyById, BLACKLIST_REASONS, CURRENT_AGENCY_ID } from '@/lib/seed';
import type { BlacklistEntry, BlacklistReasonId } from '@dzrent/types';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Field, inputClass } from '@/components/Field';

export function BlacklistModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (entry: Omit<BlacklistEntry, 'id'>) => void;
}) {
  const { t, lang } = useLang();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState<BlacklistReasonId>(BLACKLIST_REASONS[0]!.id);
  const agency = agencyById(CURRENT_AGENCY_ID);

  const submit = () => {
    if (!name.trim()) return;
    const initials = name
      .trim()
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    onAdd({
      initials,
      name,
      phone: phone || '+213 •••',
      reason,
      addedBy: agency ? agency[lang] : 'DzRent',
      date: '26 juin 2026',
      wilaya: 'Alger',
    });
  };

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center">
      <div className="dz-pop absolute inset-0 bg-[rgba(20,24,22,.5)]" onClick={onClose} />
      <div className="dz-pop relative w-[420px] rounded-r3 bg-paper p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-r2 bg-status-blacklist-bg">
            <Icon name="shield" size={20} stroke="#7A1F17" />
          </div>
          <h3 className="dz-h2 text-ink">{t('bl_add')}</h3>
        </div>

        <div className="flex flex-col gap-3.5">
          <Field label={lang === 'ar' ? 'الاسم' : 'Nom du client'}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </Field>
          <Field label={t('otp_title')}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputClass} dz-mono`}
              placeholder="+213 ..."
            />
          </Field>
          <Field label={t('bl_reason')}>
            <div className="flex flex-col gap-1.5">
              {BLACKLIST_REASONS.map((r) => {
                const on = reason === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`flex items-center gap-2.5 rounded-r2 px-3 py-2.5 text-start ${
                      on ? 'bg-status-blacklist-bg shadow-[inset_0_0_0_1.5px_#7A1F1744]' : 'bg-sand'
                    }`}
                  >
                    <span
                      className={`grid h-[18px] w-[18px] place-items-center rounded-full ${
                        on ? 'bg-status-blacklist-ink' : 'shadow-[inset_0_0_0_1.5px_#DDD7CA]'
                      }`}
                    >
                      {on && <Icon name="check" size={11} stroke="#fff" sw={3} />}
                    </span>
                    <span className="flex-1 text-[13.5px] font-medium text-ink">{r[lang]}</span>
                    <span
                      className="dz-xs font-semibold"
                      style={{ color: r.sev === 'high' ? '#7A1F17' : '#9A6516' }}
                    >
                      {r.sev === 'high' ? t('bl_sev_high') : t('bl_sev_mid')}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button variant="ghost" full onClick={onClose} className="shadow-[inset_0_0_0_1px_#DDD7CA]">
            {t('common_close')}
          </Button>
          <Button variant="dark" full icon="plus" onClick={submit} disabled={!name.trim()}>
            {t('bl_add')}
          </Button>
        </div>
      </div>
    </div>
  );
}
