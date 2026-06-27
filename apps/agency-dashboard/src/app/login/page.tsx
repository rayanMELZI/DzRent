'use client';

/**
 * Agency dashboard login — phone-first OTP against the backend (no email/password).
 * Step 1 collects the Algerian mobile number; step 2 the 6-digit code, plus a name
 * on first access (the backend registers new users on verify).
 *
 * In development the backend prints the OTP to its console (ConsoleSmsService),
 * so no real SMS is needed to sign in.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import type { Lang } from '@dzrent/i18n';
import { Button } from '@/components/Button';
import { Field, inputClass } from '@/components/Field';

export default function LoginPage() {
  const { t, lang, setLang } = useLang();
  const { requestOtp, verifyOtp } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const langs: { id: Lang; label: string }[] = [
    { id: 'fr', label: 'FR' },
    { id: 'ar', label: 'العربية' },
  ];

  const sendOtp = async () => {
    setError(null);
    setBusy(true);
    try {
      await requestOtp(phone);
      setStep('code');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError(null);
    setBusy(true);
    try {
      await verifyOtp({
        phone,
        otp,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        locale: lang,
      });
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="absolute end-5 top-5 flex gap-0.5 rounded-r2 bg-paper p-0.5 shadow-soft">
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

      <div className="dz-pop w-full max-w-sm rounded-r4 bg-paper p-7 shadow-card">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-r1 bg-primary text-lg font-bold text-white">
            D
          </div>
          <span className="text-lg font-bold tracking-tight text-ink">DzRent</span>
          <span className="dz-label ms-1 rounded bg-sand px-1.5 py-0.5 text-ink-4">Pro</span>
        </div>

        {step === 'phone' ? (
          <>
            <h1 className="dz-h2 text-ink">{t('otp_title')}</h1>
            <p className="dz-sm mt-1 text-ink-3">{t('otp_sub')}</p>
            <div className="mt-5">
              <Field label={t('otp_title')}>
                <div className="flex items-center gap-2">
                  <span className="dz-mono rounded-r2 bg-sand px-3 py-3 text-[14px] text-ink-2">
                    +213
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && phone && sendOtp()}
                    className={`${inputClass} dz-mono`}
                    placeholder={t('otp_phone_ph')}
                    inputMode="tel"
                    autoFocus
                    dir="ltr"
                  />
                </div>
              </Field>
            </div>
            {error && <p className="dz-sm mt-3 text-status-refused-ink">{error}</p>}
            <Button full className="mt-5" onClick={sendOtp} disabled={!phone || busy} iconRight="chevron">
              {t('otp_continue')}
            </Button>
            <p className="dz-xs mt-4 text-center text-ink-4">{t('otp_terms')}</p>
          </>
        ) : (
          <>
            <h1 className="dz-h2 text-ink">{t('otp_code_title')}</h1>
            <p className="dz-sm mt-1 text-ink-3">
              {t('otp_code_sub')} <span className="dz-mono text-ink-2" dir="ltr">+213 {phone}</span>
            </p>
            <div className="mt-5 flex flex-col gap-3.5">
              <Field label={t('otp_code_title')}>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && verify()}
                  className={`${inputClass} dz-mono text-center text-lg tracking-[0.5em]`}
                  placeholder="••••••"
                  inputMode="numeric"
                  autoFocus
                  dir="ltr"
                />
              </Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={lang === 'ar' ? 'الاسم' : 'Prénom'} hint={lang === 'ar' ? 'أول دخول' : '1er accès'}>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                </Field>
                <Field label={lang === 'ar' ? 'اللقب' : 'Nom'} hint={lang === 'ar' ? 'أول دخول' : '1er accès'}>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                </Field>
              </div>
            </div>
            {error && <p className="dz-sm mt-3 text-status-refused-ink">{error}</p>}
            <Button full className="mt-5" onClick={verify} disabled={otp.length !== 6 || busy}>
              {t('otp_verify')}
            </Button>
            <button
              onClick={() => {
                setStep('phone');
                setError(null);
              }}
              className="dz-sm mt-4 block w-full text-center font-semibold text-primary"
            >
              {t('common_back')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
