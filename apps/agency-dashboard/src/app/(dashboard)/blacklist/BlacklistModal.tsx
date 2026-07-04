'use client';

/**
 * "Signaler un client" — live report against `POST /blacklist`.
 * Anti-abuse rules: the target must be a registered DzRent user (phone) and a
 * written justification is mandatory — no justification, no entry.
 */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { REASON_LABELS, REPORTABLE_REASONS, useReportBlacklist } from '@/lib/blacklist';
import { ApiError } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Field, inputClass } from '@/components/Field';

export function BlacklistModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { t, lang } = useLang();
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState<string>(REPORTABLE_REASONS[0]!);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const report = useReportBlacklist();

  const canSubmit = phone.trim().length >= 9 && description.trim().length >= 5;

  const submit = () => {
    setError(null);
    report.mutate(
      { phone: phone.trim(), reason, description: description.trim() },
      {
        onSuccess: onAdded,
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : t('common_save_error')),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[300] grid place-items-center">
      <div className="dz-pop absolute inset-0 bg-[rgba(20,24,22,.5)]" onClick={onClose} />
      <div className="dz-pop relative max-h-[90vh] w-[440px] overflow-y-auto rounded-r3 bg-paper p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-r2 bg-status-blacklist-bg">
            <Icon name="shield" size={20} stroke="#7A1F17" />
          </div>
          <h3 className="dz-h2 text-ink">{t('bl_add')}</h3>
        </div>

        <div className="flex flex-col gap-3.5">
          <Field label={t('otp_title')}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputClass} dz-mono`}
              placeholder="+213 6XX XX XX XX"
              dir="ltr"
              autoFocus
            />
          </Field>

          <Field label={t('bl_reason')}>
            <div className="flex flex-col gap-1.5">
              {REPORTABLE_REASONS.map((code) => {
                const r = REASON_LABELS[code]!;
                const on = reason === code;
                return (
                  <button
                    key={code}
                    onClick={() => setReason(code)}
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

          <Field label={t('bl_justification')}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} min-h-[88px] resize-y leading-snug`}
              placeholder={t('bl_justification_ph')}
            />
          </Field>

          {error && <p className="dz-sm m-0 text-status-refused-ink">{error}</p>}
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button variant="ghost" full onClick={onClose} className="shadow-[inset_0_0_0_1px_#DDD7CA]">
            {t('common_close')}
          </Button>
          <Button variant="dark" full icon="plus" onClick={submit} disabled={!canSubmit || report.isPending}>
            {t('bl_add')}
          </Button>
        </div>
      </div>
    </div>
  );
}
