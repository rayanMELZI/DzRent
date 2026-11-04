'use client';

/**
 * Client sign-in — phone OTP only (design handoff §3.4). Step 1: number, step 2:
 * 6-digit code (+ name on first access; the backend registers new users on
 * verify). Returns to `?next=` so "Réserver" resumes where the visitor was.
 * In development the backend prints the OTP to its console.
 */
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { Button } from '@/components/Button';
import { Field, inputClass } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { Loading } from '@/components/SiteShell';

/** Only same-site relative paths are accepted as a return target. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

function Login() {
  const { t, lang } = useLang();
  const { requestOtp, verifyOtp, logout } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('err_generic'));
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = () =>
    run(async () => {
      await requestOtp(phone);
      setStep('code');
    });

  const verify = () =>
    run(async () => {
      const user = await verifyOtp({
        phone,
        otp,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        locale: lang,
      });
      if (user.role !== 'CLIENT') {
        await logout();
        setError(t('login_agency_account'));
        return;
      }
      router.replace(next);
    });

  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-12">
      <div className="dz-pop w-full max-w-sm rounded-r4 bg-paper p-7 shadow-card">
        <div className="dz-xs mb-5 inline-flex items-center gap-1.5 rounded-full bg-status-approved-bg px-2.5 py-1 font-semibold text-status-approved-ink">
          <Icon name="lock" size={13} />
          {t('home_trust3')}
        </div>

        {step === 'phone' ? (
          <>
            <h1 className="dz-h2 text-ink">{t('otp_title')}</h1>
            <p className="dz-sm mt-1 text-ink-3">{t('otp_sub')}</p>
            <div className="mt-5">
              <Field label={t('otp_title')}>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="dz-mono rounded-r2 bg-sand px-3 py-3 text-[14px] text-ink-2">
                    +213
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && phone && void sendOtp()}
                    className={`${inputClass} dz-mono`}
                    placeholder="05 / 06 / 07 .."
                    inputMode="tel"
                    autoFocus
                  />
                </div>
              </Field>
            </div>
            {error && <p className="dz-sm mt-3 text-status-refused-ink">{error}</p>}
            <Button
              full
              className="mt-5"
              onClick={() => void sendOtp()}
              disabled={!phone || busy}
              iconRight="chevron"
            >
              {t('otp_continue')}
            </Button>
            <p className="dz-xs mt-4 text-center text-ink-4">{t('otp_terms')}</p>
          </>
        ) : (
          <>
            <h1 className="dz-h2 text-ink">{t('otp_code_title')}</h1>
            <p className="dz-sm mt-1 text-ink-3">
              {t('otp_code_sub')}{' '}
              <span className="dz-mono text-ink-2" dir="ltr">
                +213 {phone}
              </span>
            </p>
            <div className="mt-5 flex flex-col gap-3.5">
              <Field label={t('otp_code_title')}>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && void verify()}
                  className={`${inputClass} dz-mono text-center text-lg tracking-[0.5em]`}
                  placeholder="••••••"
                  inputMode="numeric"
                  autoFocus
                  dir="ltr"
                />
              </Field>
              <p className="dz-xs text-ink-4">{t('login_new_user')}</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('login_first')}>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label={t('login_last')}>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
            {error && <p className="dz-sm mt-3 text-status-refused-ink">{error}</p>}
            <Button
              full
              className="mt-5"
              onClick={() => void verify()}
              disabled={otp.length !== 6 || busy}
            >
              {t('otp_verify')}
            </Button>
            <div className="mt-4 flex justify-between">
              <button
                className="dz-sm text-ink-3 hover:text-ink"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError(null);
                }}
              >
                {t('login_change_number')}
              </button>
              <button
                className="dz-sm font-semibold text-primary hover:underline disabled:opacity-50"
                disabled={busy}
                onClick={() => void sendOtp()}
              >
                {t('otp_resend')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Login />
    </Suspense>
  );
}
