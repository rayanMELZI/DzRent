'use client';

/**
 * KYC documents (design handoff §9.A.3, desktop). One card per required document
 * with its shared StatusBadge, a "Pourquoi ?" hint and a file picker.
 *
 * Upload is the backend's 3-step presigned flow: `POST /kyc/upload-intent` →
 * `PUT` the file straight to object storage → `POST /kyc/documents` to register
 * it for review. Files never transit through the API server.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KYC_BADGE, type KycDocType, type KycStatusResponse } from '@/lib/catalog';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLang, type Key } from '@/lib/i18n';
import { Button } from '@/components/Button';
import { inputClass } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { RequireAuth } from '@/components/RequireAuth';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, Loading, Page } from '@/components/SiteShell';

const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024;

function DocCard({
  type,
  status,
  rejectionReason,
}: KycStatusResponse['required'][number] & { type: KycDocType }) {
  const { t } = useLang();
  const { authedRequest } = useAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [number, setNumber] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const intent = await authedRequest<{ data: { fileKey: string; uploadUrl: string } }>(
        '/kyc/upload-intent',
        { method: 'POST', body: { documentType: type, mimeType: f.type } },
      ).then((r) => r.data);

      const put = await fetch(intent.uploadUrl, {
        method: 'PUT',
        body: f,
        headers: { 'Content-Type': f.type, 'x-amz-server-side-encryption': 'AES256' },
      }).catch(() => null);
      if (!put || !put.ok) throw new Error(t('docs_upload_failed'));

      await authedRequest('/kyc/documents', {
        method: 'POST',
        body: {
          documentType: type,
          fileKey: intent.fileKey,
          ...(number.trim() && { documentNumber: number.trim() }),
        },
      });
    },
    onSuccess: () => {
      setFile(null);
      setNumber('');
      void qc.invalidateQueries({ queryKey: ['kyc'] });
    },
  });

  const pickFile = (f: File | null) => {
    setLocalError(null);
    if (f && !ALLOWED.includes(f.type)) return setLocalError(t('docs_formats'));
    if (f && f.size > MAX_BYTES) return setLocalError(t('docs_formats'));
    setFile(f);
  };

  const canSubmit = status !== 'APPROVED' && status !== 'PENDING_REVIEW';
  const error =
    localError ??
    (upload.error
      ? upload.error instanceof ApiError || upload.error instanceof Error
        ? upload.error.message
        : t('err_generic')
      : null);

  return (
    <div className="rounded-r3 bg-paper p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-r2 bg-primary-soft text-primary-deep">
            <Icon name={type === 'SELFIE' ? 'user' : 'doc'} size={20} />
          </span>
          <span className="dz-h3 text-ink">{t(`kyc_${type}` as Key)}</span>
        </div>
        <StatusBadge status={KYC_BADGE[status]} label={t(`kst_${status}` as Key)} />
      </div>

      {status === 'REJECTED' && rejectionReason && (
        <p className="dz-sm mt-3 rounded-r2 bg-status-refused-bg px-3 py-2 text-status-refused-ink">
          <strong>{t('docs_rejected')} :</strong> {rejectionReason}
        </p>
      )}

      {canSubmit && (
        <div className="mt-4 flex flex-col gap-3">
          {type !== 'SELFIE' && (
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className={inputClass}
              placeholder={t('docs_number')}
              dir="ltr"
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="dz-sm inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-r2 px-3.5 font-semibold text-primary shadow-[inset_0_0_0_1.5px_#0F5249]">
              <Icon name="upload" size={16} />
              {file ? file.name : t('docs_choose')}
              <input
                type="file"
                className="sr-only"
                accept={ALLOWED.join(',')}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button
              size="sm"
              disabled={!file || upload.isPending}
              onClick={() => file && upload.mutate(file)}
            >
              {upload.isPending ? t('common_loading') : t('docs_send')}
            </Button>
          </div>
          <p className="dz-xs text-ink-4">{t('docs_formats')}</p>
          {upload.isSuccess && <p className="dz-sm text-status-approved-ink">{t('docs_sent')}</p>}
          {error && <p className="dz-sm text-status-refused-ink">{error}</p>}
        </div>
      )}
    </div>
  );
}

function Documents() {
  const { t } = useLang();
  const { authedRequest } = useAuth();
  const q = useQuery({
    queryKey: ['kyc'],
    queryFn: () => authedRequest<{ data: KycStatusResponse }>('/kyc/me').then((r) => r.data),
  });

  return (
    <Page narrow>
      <h1 className="dz-h1 text-ink">{t('docs_title')}</h1>
      <p className="dz-body mt-1.5 text-ink-3">{t('docs_sub')}</p>

      {q.isLoading ? (
        <Loading />
      ) : q.isError || !q.data ? (
        <div className="mt-6">
          <ErrorState
            message={q.error instanceof ApiError ? q.error.message : t('err_generic')}
            onRetry={() => void q.refetch()}
          />
        </div>
      ) : (
        <>
          <div
            className={`dz-sm mt-6 flex items-center gap-2 rounded-r2 px-4 py-3 font-medium ${
              q.data.isEligibleForBooking
                ? 'bg-status-approved-bg text-status-approved-ink'
                : 'bg-status-pending-bg text-status-pending-ink'
            }`}
          >
            <Icon name={q.data.isEligibleForBooking ? 'check' : 'info'} size={17} />
            {q.data.isEligibleForBooking ? t('docs_eligible') : t('docs_not_eligible')}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {q.data.required.map((d) => (
              <DocCard key={d.documentType} type={d.documentType} {...d} />
            ))}
          </div>
          {!q.data.isEligibleForBooking && (
            <p className="dz-xs mt-5 text-ink-4">{t('kyc_pending_note')}</p>
          )}
        </>
      )}
    </Page>
  );
}

export default function DocumentsPage() {
  return (
    <RequireAuth>
      <Documents />
    </RequireAuth>
  );
}
