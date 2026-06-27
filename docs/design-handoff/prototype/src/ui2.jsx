// ui2.jsx — composite widgets: Sheet, Field, PriceBreakdown, DepositBox,
// DocUpload, WilayaPicker.

// ---------- Bottom sheet (mobile modal) ----------
function Sheet({ open, onClose, title, children, height = '74%' }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} className="dz-pop" style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,22,.42)' }} />
      <div className="dz-enter" style={{
        position: 'relative', background: T.paper, borderRadius: '22px 22px 0 0', maxHeight: height,
        height, display: 'flex', flexDirection: 'column', boxShadow: T.shadowUp,
      }}>
        <div style={{ padding: '12px 18px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.line3}` }}>
          <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 38, height: 4, borderRadius: 9, background: T.line2 }} />
          <div className="dz-h3" style={{ marginTop: 4 }}>{title}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: T.sand, display: 'grid', placeItems: 'center', marginTop: 4 }}>
            <Icon name="x" size={17} stroke={T.ink2} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ---------- Field (label + control) ----------
function Field({ label, children, hint, icon }) {
  return (
    <label style={{ display: 'block' }}>
      <div className="dz-label" style={{ color: T.ink3, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <Icon name={icon} size={13} stroke={T.ink4} />}{label}
      </div>
      {children}
      {hint && <div className="dz-xs" style={{ color: T.ink4, marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

const inputStyle = {
  width: '100%', padding: '13px 14px', borderRadius: 12, fontSize: 15,
  background: T.paper, color: T.ink, boxShadow: `inset 0 0 0 1px ${T.line2}`,
  border: 'none', outline: 'none',
};

// ---------- Price breakdown (deposit quarantined) ----------
function PriceBreakdown({ pricePerDay, days, addonsTotal = 0, insurancePerDay = 800, deposit, t, lang, compact }) {
  const subtotal = pricePerDay * days + addonsTotal;
  const insurance = insurancePerDay * days;
  const tva = Math.round(subtotal * 0.19);
  const total = subtotal + tva + insurance;
  const Row = ({ label, val, strong }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0', fontSize: strong ? 15 : 14, color: strong ? T.ink : T.ink2, fontWeight: strong ? 600 : 400 }}>
      <span>{label}</span>
      <span className="dz-mono dz-tnum" style={{ fontSize: 13.5 }}>{fmtDZD(val)} <span style={{ color: T.ink4, fontSize: 11 }}>{t('common_dzd')}</span></span>
    </div>
  );
  return (
    <div>
      <div style={{ background: T.paper, borderRadius: 14, padding: '6px 16px', boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
        <Row label={`${t('co_subtotal')} · ${fmtDZD(pricePerDay)}×${days}`} val={pricePerDay * days} />
        {addonsTotal > 0 && <Row label={t('co_addons')} val={addonsTotal} />}
        <Row label={t('co_insurance')} val={insurance} />
        <Row label={t('co_tva')} val={tva} />
      </div>
      {/* total banner */}
      <div style={{
        marginTop: 10, background: T.primary, color: '#fff', borderRadius: 14, padding: '14px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{t('co_total')}</span>
        <span className="dz-mono" style={{ fontSize: 19, fontWeight: 600 }}>{fmtDZD(total)} <span style={{ fontSize: 12, opacity: .8 }}>{t('common_dzd')}</span></span>
      </div>
      {/* deposit — quarantined */}
      <DepositBox deposit={deposit} t={t} />
      <input type="hidden" value={total} readOnly />
    </div>
  );
}

// ---------- Deposit box (cold, dashed, return arrow) ----------
function DepositBox({ deposit, t }) {
  return (
    <div style={{
      marginTop: 10, background: T.depositBg, color: T.depositInk, borderRadius: 14, padding: '13px 15px',
      border: `1.5px dashed ${T.depositLine}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
          <Icon name="arrowReturn" size={18} stroke={T.depositInk} className="dz-flip" />
          {t('co_deposit')}
        </span>
        <span className="dz-mono" style={{ fontSize: 16, fontWeight: 600 }}>{fmtDZD(deposit)} <span style={{ fontSize: 11, opacity: .7 }}>{t('common_dzd')}</span></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', background: '#fff', color: T.depositInk, padding: '3px 7px', borderRadius: 6, border: `1px solid ${T.depositLine}55` }}>{t('co_deposit_tag')}</span>
        <span className="dz-xs" style={{ color: T.depositInk, opacity: .85 }}>{t('co_deposit_note')}</span>
      </div>
    </div>
  );
}

// ---------- Document upload card ----------
function DocUpload({ doc, status, onCapture, t, lang }) {
  const [showWhy, setShowWhy] = React.useState(false);
  const captured = status && status !== 'none';
  return (
    <div style={{ background: T.paper, borderRadius: 14, padding: 14, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="dz-h3" style={{ fontSize: 15 }}>{doc[lang]}</div>
          </div>
          <button onClick={() => setShowWhy(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, color: T.primary, fontSize: 12.5, fontWeight: 500 }}>
            <Icon name="shield" size={13} stroke={T.primary} /> {t('kyc_why')}
          </button>
          {showWhy && <div className="dz-sm dz-enter" style={{ color: T.ink2, marginTop: 6, lineHeight: 1.5 }}>{doc.why[lang]}</div>}
        </div>
        <StatusBadge status={status || 'none'} size="sm" t={t} />
      </div>

      {captured ? (
        <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Placeholder label={`scan · ${doc.id}`} height={54} radius={9} style={{ width: 84, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="dz-sm" style={{ color: T.ink2, fontWeight: 500 }}>
              {status === 'refused' ? (lang==='ar'?'مرفوض — أعد الإرسال':'Refusé — à reprendre') :
               status === 'pending' ? (lang==='ar'?'قيد المراجعة':'En cours de revue') :
               (lang==='ar'?'تم القبول':'Validé')}
            </div>
            <button onClick={() => onCapture(doc.id)} style={{ color: status === 'refused' ? T.clay : T.ink3, fontSize: 12.5, fontWeight: 600, marginTop: 3 }}>
              {t('kyc_retake')}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', gap: 9 }}>
          <Button size="sm" variant="soft" icon="camera" onClick={() => onCapture(doc.id)} style={{ flex: 1 }}>{t('kyc_take_photo')}</Button>
          <Button size="sm" variant="ghost" icon="upload" onClick={() => onCapture(doc.id)} style={{ flex: 1, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>{t('kyc_upload')}</Button>
        </div>
      )}
    </div>
  );
}

// ---------- Wilaya picker (grouped + search) ----------
function WilayaPicker({ open, onClose, onPick, t, lang }) {
  const [q, setQ] = React.useState('');
  const ql = q.trim().toLowerCase();
  return (
    <Sheet open={open} onClose={onClose} title={t('search_wilaya')} height="82%">
      <div style={{ padding: '12px 16px', position: 'sticky', top: 0, background: T.paper, zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, ...inputStyle, padding: '11px 13px' }}>
          <Icon name="search" size={17} stroke={T.ink4} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t('search_wilaya_find')}
            style={{ border: 'none', outline: 'none', background: 'none', flex: 1, fontSize: 15, color: T.ink }} />
        </div>
      </div>
      <div style={{ padding: '4px 16px 20px' }}>
        {REGIONS.map(region => {
          const ws = region.wilayas.filter(w => !ql || w[lang].toLowerCase().includes(ql) || w.fr.toLowerCase().includes(ql) || w.code.includes(ql));
          if (!ws.length) return null;
          return (
            <div key={region.id} style={{ marginBottom: 14 }}>
              <div className="dz-label" style={{ color: T.ink4, margin: '8px 2px' }}>{region[lang]}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ws.map(w => (
                  <button key={w.code} onClick={() => { onPick(w); onClose(); }} style={{
                    display: 'flex', alignItems: 'center', gap: 11, padding: '11px 10px', borderRadius: 10,
                    textAlign: 'start', transition: 'background .12s',
                  }} onMouseEnter={e => e.currentTarget.style.background = T.sand} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span className="dz-mono" style={{ fontSize: 12, color: T.ink4, width: 22 }}>{w.code}</span>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{w[lang]}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

Object.assign(window, { Sheet, Field, inputStyle, PriceBreakdown, DepositBox, DocUpload, WilayaPicker });
