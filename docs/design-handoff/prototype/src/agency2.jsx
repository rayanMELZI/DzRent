// agency2.jsx — RequestsQueue (KYC snapshot, approve/refuse → live to client) + Blacklist.

// ============== REQUESTS QUEUE ==============
function RequestsQueue() {
  const { t, lang } = useAgency();
  const store = useStore();
  const [tab, setTab] = React.useState('pending');
  const [selId, setSelId] = React.useState(null);

  const filtered = store.requests.filter(r => r.status === tab);
  const sel = store.requests.find(r => r.id === selId) || filtered[0] || store.requests[0];

  React.useEffect(() => { if (filtered.length && (!sel || sel.status !== tab)) setSelId(filtered[0].id); }, [tab]);

  const tabs = [
    { id: 'pending', key: 'req_pending', n: store.requests.filter(r => r.status === 'pending').length },
    { id: 'approved', key: 'req_approved', n: store.requests.filter(r => r.status === 'approved').length },
    { id: 'refused', key: 'req_refused', n: store.requests.filter(r => r.status === 'refused').length },
  ];

  return (
    <div style={{ display: 'flex', gap: 18, height: '100%', minHeight: 0 }}>
      {/* list */}
      <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: T.paper, padding: 4, borderRadius: 11, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => { setTab(tb.id); }} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: tab === tb.id ? T.primary : 'transparent', color: tab === tb.id ? '#fff' : T.ink3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {t(tb.key)} {tb.n > 0 && <span style={{ fontSize: 11, background: tab === tb.id ? 'rgba(255,255,255,.22)' : T.sand, padding: '1px 6px', borderRadius: 999 }}>{tb.n}</span>}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 9, paddingInlineEnd: 4 }}>
          {filtered.map(r => {
            const car = carById(r.car);
            const on = sel && sel.id === r.id;
            return (
              <button key={r.id} onClick={() => setSelId(r.id)} style={{ textAlign: 'start', background: T.paper, borderRadius: 13, padding: 13, boxShadow: on ? `inset 0 0 0 2px ${T.primary}` : T.shadow, transition: 'box-shadow .14s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: r.flagged ? T.status.refused.bg : T.primarySoft, color: r.flagged ? T.status.refused.ink : T.primaryDeep, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>{r.customer.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{r.customer.name}</span>
                      {r.justNow && <span style={{ fontSize: 9.5, fontWeight: 700, color: '#fff', background: T.clay, padding: '2px 6px', borderRadius: 999, letterSpacing: '.04em' }}>{t('req_new')}</span>}
                    </div>
                    <div className="dz-xs" style={{ color: T.ink4, marginTop: 2 }}>{car[lang]} · {r.createdAt}</div>
                  </div>
                  {r.flagged && <Icon name="alert" size={18} stroke={T.status.refused.ink} />}
                </div>
              </button>
            );
          })}
          {!filtered.length && <div style={{ textAlign: 'center', color: T.ink4, padding: '40px 0' }} className="dz-body">{t('req_empty')}</div>}
        </div>
      </div>

      {/* detail */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        {sel ? <RequestDetail key={sel.id} req={sel} t={t} lang={lang} store={store} /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: T.ink4 }} className="dz-body">{t('req_empty')}</div>}
      </div>
    </div>
  );
}

function RequestDetail({ req, t, lang, store }) {
  const car = carById(req.car);
  const c = req.customer;
  const blEntry = store.blacklist.find(b => b.name && c.name && b.name.split(' ')[0][0] === c.name[0] && false); // demo: not blacklisted
  const act = (status) => {
    store.setRequestStatus(req.id, status);
    store.showToast(status === 'approved' ? t('req_approved_toast') : t('req_refused_toast'), status === 'approved' ? 'ok' : 'err');
  };

  return (
    <div className="dz-enter" style={{ background: T.paper, borderRadius: 16, boxShadow: T.shadow, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 22 }}>
        {/* customer header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 999, background: req.flagged ? T.status.refused.bg : T.primarySoft, color: req.flagged ? T.status.refused.ink : T.primaryDeep, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 19 }}>{c.initials}</div>
          <div style={{ flex: 1 }}>
            <div className="dz-h2">{c.name}</div>
            <div className="dz-mono" style={{ fontSize: 13, color: T.ink3, marginTop: 2 }} dir="ltr">{c.phone}</div>
          </div>
          <div style={{ textAlign: lang==='ar'?'left':'right' }}>
            <div className="dz-sm" style={{ color: T.ink3 }}>{c.rentals} {t('req_rentals_done')}</div>
            <div className="dz-xs" style={{ color: T.ink4 }}>{t('req_member_since')} {c.joined}</div>
          </div>
        </div>

        {/* trust checks row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <div style={{ flex: 1, padding: '11px 13px', borderRadius: 11, background: c.blacklisted ? T.status.blacklist.bg : T.status.approved.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="shield" size={17} stroke={c.blacklisted ? T.status.blacklist.ink : T.status.approved.ink} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: c.blacklisted ? T.status.blacklist.ink : T.status.approved.ink }}>{c.blacklisted ? t('st_blacklist') : t('req_not_bl')}</span>
          </div>
          <div style={{ flex: 1, padding: '11px 13px', borderRadius: 11, background: c.riskFlags.length ? T.status.refused.bg : T.status.approved.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name={c.riskFlags.length ? 'alert' : 'check'} size={17} stroke={c.riskFlags.length ? T.status.refused.ink : T.status.approved.ink} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: c.riskFlags.length ? T.status.refused.ink : T.status.approved.ink }}>{c.riskFlags.length ? `${c.riskFlags.length} ${t('req_risk').toLowerCase()}` : t('req_no_risk')}</span>
          </div>
        </div>

        {/* risk flags detail */}
        {c.riskFlags.length > 0 && (
          <div style={{ marginTop: 12, background: T.status.refused.bg, borderRadius: 12, padding: '12px 14px' }}>
            <div className="dz-label" style={{ color: T.status.refused.ink, marginBottom: 8 }}>{t('req_risk')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {c.riskFlags.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.status.refused.ink }}>
                  <Icon name="alert" size={15} stroke={T.status.refused.ink} />{f[lang]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KYC snapshot inline */}
        <h3 className="dz-h3" style={{ margin: '22px 0 12px' }}>{t('req_kyc_snapshot')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 11 }}>
          {KYC_DOCS.map(dc => {
            const status = c.kyc[dc.id] || 'none';
            return (
              <div key={dc.id} style={{ display: 'flex', gap: 11, background: T.sand, borderRadius: 12, padding: 11 }}>
                <Placeholder label={`scan · ${dc.id}`} height={56} radius={9} style={{ width: 76, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{dc[lang]}</div>
                  <StatusBadge status={status} size="sm" t={t} />
                </div>
              </div>
            );
          })}
        </div>

        {/* booking */}
        <h3 className="dz-h3" style={{ margin: '22px 0 12px' }}>{t('req_period')}</h3>
        <div style={{ display: 'flex', gap: 14, background: T.sand, borderRadius: 13, padding: 14 }}>
          <Placeholder label={`photo · ${car.fr}`} height={64} radius={10} style={{ width: 96, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="dz-h3" style={{ fontSize: 15 }}>{car[lang]}</div>
            <div className="dz-sm dz-mono" style={{ color: T.ink2, marginTop: 5 }} dir={lang==='ar'?'rtl':'ltr'}>{req.from} → {req.to} · {req.days} {t('co_days')}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
              <div><div className="dz-xs" style={{ color: T.ink4 }}>{t('co_total')}</div><div className="dz-mono" style={{ fontWeight: 600, fontSize: 15 }}>{fmtDZD(req.total)} <span style={{ fontSize: 10, color: T.ink4 }}>{t('common_dzd')}</span></div></div>
              <div style={{ borderInlineStart: `1.5px dashed ${T.depositLine}`, paddingInlineStart: 16 }}><div className="dz-xs" style={{ color: T.depositInk }}>{t('co_deposit')}</div><div className="dz-mono" style={{ fontWeight: 600, fontSize: 15, color: T.depositInk }}>{fmtDZD(req.deposit)} <span style={{ fontSize: 10, opacity: .7 }}>{t('common_dzd')}</span></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* action bar */}
      {req.status === 'pending' ? (
        <div style={{ flexShrink: 0, padding: 16, borderTop: `1px solid ${T.line2}`, display: 'flex', gap: 12 }}>
          <Button variant="danger" icon="x" onClick={() => act('refused')} style={{ flex: 1 }}>{t('req_refuse')}</Button>
          <Button variant="primary" icon="check" onClick={() => act('approved')} style={{ flex: 2 }}>{t('req_approve')}</Button>
        </div>
      ) : (
        <div style={{ flexShrink: 0, padding: 16, borderTop: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          <StatusBadge status={req.status === 'approved' ? 'approved' : 'refused'} t={t} />
          <span className="dz-sm" style={{ color: T.ink4 }}>{lang==='ar'?'تمت المعالجة':'Traitée'}</span>
        </div>
      )}
    </div>
  );
}

// ============== BLACKLIST ==============
function Blacklist() {
  const { t, lang } = useAgency();
  const store = useStore();
  const [q, setQ] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const ql = q.trim().toLowerCase();
  const list = store.blacklist.filter(b => !ql || b.name.toLowerCase().includes(ql) || b.phone.includes(ql));

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <p className="dz-sm" style={{ color: T.ink3, margin: 0, maxWidth: 520 }}>{t('bl_sub')}</p>
        </div>
        <Button size="sm" variant="dark" icon="plus" onClick={() => setAdding(true)}>{t('bl_add')}</Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.paper, borderRadius: 11, padding: '10px 14px', boxShadow: `inset 0 0 0 1px ${T.line2}`, marginBottom: 16, maxWidth: 420 }}>
        <Icon name="search" size={17} stroke={T.ink4} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('bl_search')} style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: 14, color: T.ink }} />
      </div>

      <div style={{ background: T.paper, borderRadius: 14, boxShadow: T.shadow, overflow: 'hidden' }}>
        {list.map((b, i) => {
          const reason = BLACKLIST_REASONS.find(r => r.id === b.reason);
          return (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i === list.length - 1 ? 'none' : `1px solid ${T.line3}` }}>
              <div style={{ width: 42, height: 42, borderRadius: 999, background: T.status.blacklist.bg, color: T.status.blacklist.ink, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>{b.initials}</div>
              <div style={{ width: 150 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                <div className="dz-mono" style={{ fontSize: 11.5, color: T.ink4 }} dir="ltr">{b.phone}</div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, color: T.status.blacklist.ink, background: T.status.blacklist.bg }}>
                  <span style={{ width: 7, height: 7, borderRadius: 9, background: reason.sev === 'high' ? T.status.blacklist.ink : T.status.expiring.dot }} />
                  {reason[lang]}
                </span>
                <span style={{ marginInlineStart: 8, fontSize: 11, fontWeight: 600, color: reason.sev === 'high' ? T.status.blacklist.ink : T.status.expiring.ink }}>{reason.sev === 'high' ? t('bl_sev_high') : t('bl_sev_mid')}</span>
              </div>
              <div className="dz-sm" style={{ color: T.ink3, width: 150 }}>
                <div>{t('bl_added_by')} <span style={{ fontWeight: 600, color: T.ink2 }}>{b.addedBy}</span></div>
                <div className="dz-xs" style={{ color: T.ink4 }}>{b.date} · {b.wilaya}</div>
              </div>
            </div>
          );
        })}
        {!list.length && <div style={{ padding: 40, textAlign: 'center', color: T.ink4 }} className="dz-body">—</div>}
      </div>

      {adding && <BlacklistModal onClose={() => setAdding(false)} onAdd={(e) => { store.addBlacklist(e); store.showToast(lang==='ar'?'أُضيف للقائمة':'Ajouté à la liste'); setAdding(false); }} t={t} lang={lang} />}
    </div>
  );
}

function BlacklistModal({ onClose, onAdd, t, lang }) {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [reason, setReason] = React.useState(BLACKLIST_REASONS[0].id);
  const submit = () => {
    if (!name.trim()) return;
    const initials = name.trim().split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    onAdd({ initials, name, phone: phone || '+213 •••', reason, addedBy: AGENCY_ME[lang], date: '26 juin 2026', wilaya: 'Alger' });
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'grid', placeItems: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,22,.5)' }} className="dz-pop" />
      <div className="dz-pop" style={{ position: 'relative', background: T.paper, borderRadius: 16, padding: 24, width: 420, boxShadow: '0 30px 80px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.status.blacklist.bg, display: 'grid', placeItems: 'center' }}><Icon name="shield" size={20} stroke={T.status.blacklist.ink} /></div>
          <h3 className="dz-h2" style={{ margin: 0 }}>{t('bl_add')}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={lang==='ar'?'الاسم':'Nom du client'}><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} autoFocus /></Field>
          <Field label={t('otp_title')}><input value={phone} onChange={e => setPhone(e.target.value)} className="dz-mono" style={inputStyle} placeholder="+213 ..." /></Field>
          <Field label={t('bl_reason')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {BLACKLIST_REASONS.map(r => (
                <button key={r.id} onClick={() => setReason(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textAlign: 'start', background: reason === r.id ? T.status.blacklist.bg : T.sand, boxShadow: reason === r.id ? `inset 0 0 0 1.5px ${T.status.blacklist.ink}44` : 'none' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center', background: reason === r.id ? T.status.blacklist.ink : 'transparent', boxShadow: reason === r.id ? 'none' : `inset 0 0 0 1.5px ${T.line2}` }}>{reason === r.id && <Icon name="check" size={11} stroke="#fff" sw={3} />}</span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{r[lang]}</span>
                  <span className="dz-xs" style={{ color: r.sev === 'high' ? T.status.blacklist.ink : T.status.expiring.ink, fontWeight: 600 }}>{r.sev === 'high' ? t('bl_sev_high') : t('bl_sev_mid')}</span>
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Button variant="ghost" full onClick={onClose} style={{ boxShadow: `inset 0 0 0 1px ${T.line2}` }}>{t('common_close')}</Button>
          <Button variant="dark" full icon="plus" onClick={submit} disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : .5 }}>{t('bl_add')}</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RequestsQueue, RequestDetail, Blacklist, BlacklistModal });
