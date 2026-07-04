'use client';

/**
 * Request detail — the trust review panel (design handoff §9.B.3): customer header,
 * two trust checks (blacklist presence + risk-signal count), expanded risk flags,
 * the inline KYC snapshot, the booking period with total and deposit shown
 * separately (deposit quarantined), and the approve/refuse action bar.
 */
import { useLang } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { KYC_DOCS } from '@/lib/seed';
import { useRequestDecision } from '@/lib/requests';
import { REASON_LABELS } from '@/lib/blacklist';
import { dayMonth } from '@/lib/dates';
import { ApiError } from '@/lib/api';
import { formatDZD } from '@dzrent/i18n';
import type { KycStatus, Request } from '@dzrent/types';
import type { StatusToken } from '@dzrent/tokens';
import type { StringKey } from '@dzrent/i18n';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { Placeholder } from '@/components/Placeholder';

const KYC_BADGE: Record<KycStatus, { token: StatusToken; labelKey: StringKey }> = {
  approved: { token: 'approved', labelKey: 'st_approved' },
  pending: { token: 'pending', labelKey: 'st_pending' },
  refused: { token: 'refused', labelKey: 'st_refused' },
  none: { token: 'none', labelKey: 'st_none' },
};

export function RequestDetail({ req }: { req: Request }) {
  const { t, lang } = useLang();
  const { showToast } = useStore();
  const decision = useRequestDecision();
  const carName = req.car;
  const c = req.customer;

  const act = (status: 'approved' | 'refused') => {
    decision.mutate(
      status === 'approved'
        ? { id: req.id, action: 'approve' }
        : { id: req.id, action: 'reject', reason: t('req_refuse_reason') },
      {
        onSuccess: () =>
          showToast(
            status === 'approved' ? t('req_approved_toast') : t('req_refused_toast'),
            status === 'approved' ? 'ok' : 'err',
          ),
        onError: (err) =>
          showToast(err instanceof ApiError ? err.message : t('req_action_error'), 'err'),
      },
    );
  };

  return (
    <div className="dz-enter flex h-full min-h-0 flex-col overflow-hidden rounded-r3 bg-paper shadow-soft">
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {/* customer header */}
        <div className="flex items-center gap-3.5">
          <div
            className="grid h-14 w-14 place-items-center rounded-full text-[19px] font-semibold"
            style={{
              background: req.flagged ? '#F8E3E1' : '#E2ECEA',
              color: req.flagged ? '#9C352B' : '#0B3F38',
            }}
          >
            {c.initials}
          </div>
          <div className="flex-1">
            <div className="dz-h2 text-ink">{c.name}</div>
            <div className="dz-mono mt-0.5 text-[13px] text-ink-3" dir="ltr">
              {c.phone}
            </div>
          </div>
          <div className="text-end">
            <div className="dz-sm text-ink-3">
              {c.rentals} {t('req_rentals_done')}
            </div>
            <div className="dz-xs text-ink-4">
              {t('req_member_since')} {c.joined}
            </div>
          </div>
        </div>

        {/* trust checks */}
        <div className="mt-4 flex gap-2.5">
          <TrustCheck
            ok={!c.blacklisted}
            icon="shield"
            okToken="approved"
            badToken="blacklist"
            label={
              c.blacklisted
                ? `${t('st_blacklist')} · ${
                    (c.blacklistAgencyCount ?? 1) === 1
                      ? t('bl_agencies_one')
                      : `${c.blacklistAgencyCount} ${t('bl_agencies_n')}`
                  }`
                : t('req_not_bl')
            }
          />
          <TrustCheck
            ok={c.riskFlags.length === 0}
            icon={c.riskFlags.length ? 'alert' : 'check'}
            okToken="approved"
            badToken="refused"
            label={
              c.riskFlags.length
                ? `${c.riskFlags.length} ${t('req_risk').toLowerCase()}`
                : t('req_no_risk')
            }
          />
        </div>

        {/* blacklist reports — each with its mandatory justification */}
        {c.blacklisted && (c.blacklistEntries?.length ?? 0) > 0 && (
          <div className="mt-3 rounded-r2 bg-status-blacklist-bg px-3.5 py-3">
            <div className="dz-label mb-2 text-status-blacklist-ink">{t('bl_reason')}</div>
            <div className="flex flex-col gap-2.5">
              {c.blacklistEntries!.map((e, i) => {
                const reason = REASON_LABELS[e.reason];
                return (
                  <div key={i} className="text-[13px] text-status-blacklist-ink">
                    <div className="flex items-center gap-2 font-semibold">
                      <Icon name="shield" size={14} stroke="#7A1F17" />
                      {reason ? reason[lang] : e.reason}
                      <span className="dz-xs font-normal opacity-75">
                        — {e.agencyName} · {dayMonth(e.createdAt, lang)}
                      </span>
                    </div>
                    <p className="m-0 mt-1 ps-[22px] text-[12.5px] leading-snug opacity-90">
                      {e.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* risk flags detail */}
        {c.riskFlags.length > 0 && (
          <div className="mt-3 rounded-r2 bg-status-refused-bg px-3.5 py-3">
            <div className="dz-label mb-2 text-status-refused-ink">{t('req_risk')}</div>
            <div className="flex flex-col gap-1.5">
              {c.riskFlags.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] text-status-refused-ink">
                  <Icon name="alert" size={15} stroke="#9C352B" />
                  {f[lang]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KYC snapshot */}
        <h3 className="dz-h3 mb-3 mt-6 text-ink">{t('req_kyc_snapshot')}</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {KYC_DOCS.map((dc) => {
            const st = c.kyc[dc.id] ?? 'none';
            const badge = KYC_BADGE[st];
            return (
              <div key={dc.id} className="flex gap-2.5 rounded-r2 bg-sand p-2.5">
                <Placeholder label={`scan · ${dc.id}`} height={56} radius={9} style={{ width: 76, flexShrink: 0 }} />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="text-[12.5px] font-semibold leading-tight text-ink">{dc[lang]}</div>
                  <StatusBadge status={badge.token} label={t(badge.labelKey)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* booking period */}
        <h3 className="dz-h3 mb-3 mt-6 text-ink">{t('req_period')}</h3>
        <div className="flex gap-3.5 rounded-r2 bg-sand p-3.5">
          <Placeholder label={`photo · ${carName}`} height={64} radius={10} style={{ width: 96, flexShrink: 0 }} />
          <div className="flex-1">
            <div className="dz-h3 text-[15px] text-ink">{carName}</div>
            <div className="dz-sm dz-mono mt-1.5 text-ink-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {req.from} → {req.to} · {req.days} {t('co_days')}
            </div>
            <div className="mt-2.5 flex gap-4">
              <div>
                <div className="dz-xs text-ink-4">{t('co_total')}</div>
                <div className="dz-mono text-[15px] font-semibold text-ink">
                  {formatDZD(req.total)} <span className="text-[10px] text-ink-4">{t('common_dzd')}</span>
                </div>
              </div>
              <div className="border-deposit-line ps-4" style={{ borderInlineStartWidth: 1.5, borderInlineStartStyle: 'dashed' }}>
                <div className="dz-xs text-deposit-ink">{t('co_deposit')}</div>
                <div className="dz-mono text-[15px] font-semibold text-deposit-ink">
                  {formatDZD(req.deposit)} <span className="text-[10px] opacity-70">{t('common_dzd')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* action bar */}
      {req.status === 'pending' ? (
        <div className="flex shrink-0 gap-3 border-t border-line-2 p-4">
          <Button
            variant="danger"
            icon="x"
            className="flex-1"
            disabled={decision.isPending}
            onClick={() => act('refused')}
          >
            {t('req_refuse')}
          </Button>
          <Button
            variant="primary"
            icon="check"
            className="flex-[2]"
            disabled={decision.isPending}
            onClick={() => act('approved')}
          >
            {t('req_approve')}
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-center gap-2.5 border-t border-line-2 p-4">
          <StatusBadge
            status={req.status === 'approved' ? 'approved' : 'refused'}
            label={req.status === 'approved' ? t('st_approved') : t('st_refused')}
          />
          <span className="dz-sm text-ink-4">{lang === 'ar' ? 'تمت المعالجة' : 'Traitée'}</span>
        </div>
      )}
    </div>
  );
}

function TrustCheck({
  ok,
  icon,
  okToken,
  badToken,
  label,
}: {
  ok: boolean;
  icon: 'shield' | 'alert' | 'check';
  okToken: StatusToken;
  badToken: StatusToken;
  label: string;
}) {
  const token = ok ? okToken : badToken;
  const tokenClass = ok
    ? 'bg-status-approved-bg text-status-approved-ink'
    : badToken === 'blacklist'
      ? 'bg-status-blacklist-bg text-status-blacklist-ink'
      : 'bg-status-refused-bg text-status-refused-ink';
  const stroke = ok ? '#1F6B41' : badToken === 'blacklist' ? '#7A1F17' : '#9C352B';
  return (
    <div className={`flex flex-1 items-center gap-2 rounded-r2 px-3.5 py-3 ${tokenClass}`}>
      <Icon name={icon} size={17} stroke={stroke} />
      <span className="text-[12.5px] font-semibold">{label}</span>
    </div>
  );
}
