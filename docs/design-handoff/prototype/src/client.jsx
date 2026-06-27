// client.jsx — Client PWA: shell, nav/context, OTP, KYC, search,
// agency-first results, agency page. (Detail→confirm in client2.jsx)

const ClientContext = React.createContext(null);
const useClient = () => React.useContext(ClientContext);

const MAIN_SCREENS = ['home', 'trips', 'docs', 'profile'];

function ClientApp() {
  const { t, lang } = useLang();
  const [stack, setStack] = React.useState(['otp']);
  const screen = stack[stack.length - 1];
  const [draft, setDraftState] = React.useState({
    phone: '', kyc: { cin: 'none', permis: 'none', selfie: 'none', domicile: 'none' },
    wilaya: AGENCIES[0] ? { code: '16', fr: 'Alger', ar: 'الجزائر' } : null,
    from: '28 juin', to: '02 juil.', days: 5, category: 'all',
    agencyId: null, carId: null,
    addons: {}, payMethod: null, bookingId: null,
  });
  const setDraft = (patch) => setDraftState(d => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) }));

  const go = (s, reset) => setStack(st => reset ? [s] : [...st, s]);
  const back = () => setStack(st => st.length > 1 ? st.slice(0, -1) : st);
  const resetTo = (s) => setStack([s]);

  const ctx = { screen, draft, setDraft, go, back, resetTo, t, lang };
  const showNav = MAIN_SCREENS.includes(screen);

  const SCREENS = {
    otp: OtpPhone, otpcode: OtpCode, kyc: KycFlow,
    home: HomeSearch, results: ResultsAgencies, agency: AgencyPage,
    car: CarDetail, checkout: Checkout, contract: Contract, payment: Payment,
    confirm: Confirmation, trips: TripsScreen, docs: DocsScreen, profile: ProfileScreen,
  };
  const Screen = SCREENS[screen] || HomeSearch;

  return (
    <ClientContext.Provider value={ctx}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative', background: T.sand }}>
        <div key={screen} className="dz-enter" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Screen />
        </div>
        {showNav && <ClientNav screen={screen} go={resetTo} t={t} />}
      </div>
    </ClientContext.Provider>
  );
}

// ---------- shared client chrome ----------
function CHeader({ title, sub, onBack, right, sticky = true, scheme = 'sand' }) {
  const { back } = useClient();
  const dark = scheme === 'green';
  return (
    <div style={{
      flexShrink: 0, padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 12,
      background: dark ? T.primary : T.sand, color: dark ? '#fff' : T.ink,
      position: sticky ? 'sticky' : 'static', top: 0, zIndex: 20,
      borderBottom: dark ? 'none' : `1px solid ${T.line3}`,
    }}>
      <button onClick={onBack || back} style={{
        width: 38, height: 38, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center',
        background: dark ? 'rgba(255,255,255,.14)' : T.paper, boxShadow: dark ? 'none' : `inset 0 0 0 1px ${T.line2}`,
      }}>
        <Icon name="back" size={19} stroke={dark ? '#fff' : T.ink} className="dz-flip" />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="dz-h2" style={{ color: dark ? '#fff' : T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {sub && <div className="dz-sm" style={{ color: dark ? 'rgba(255,255,255,.8)' : T.ink3 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function ClientNav({ screen, go, t }) {
  const items = [
    { id: 'home', icon: 'home', label: t('nav_home') },
    { id: 'trips', icon: 'car', label: t('nav_trips') },
    { id: 'docs', icon: 'doc', label: t('nav_docs') },
    { id: 'profile', icon: 'user', label: t('nav_profile') },
  ];
  return (
    <div style={{
      flexShrink: 0, height: 64, background: T.paper, borderTop: `1px solid ${T.line2}`,
      display: 'flex', alignItems: 'stretch', paddingBottom: 6,
    }}>
      {items.map(it => {
        const on = screen === it.id;
        return (
          <button key={it.id} onClick={() => go(it.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            color: on ? T.primary : T.ink4,
          }}>
            <Icon name={it.icon} size={22} stroke={on ? T.primary : T.ink4} sw={on ? 2 : 1.7} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============== OTP ==============
function OtpPhone() {
  const { go, draft, setDraft, t, lang } = useClient();
  const [val, setVal] = React.useState(draft.phone || '');
  const ok = val.replace(/\D/g, '').length >= 9;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 22px', background: T.sand }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', maxWidth: 340, paddingTop: '13%' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.primary, display: 'grid', placeItems: 'center', marginBottom: 22 }}>
          <Icon name="phone" size={26} stroke="#fff" />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start', background: T.primarySoft, color: T.primaryDeep, padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, marginBottom: 16 }}>
          <Icon name="shield" size={14} stroke={T.primaryDeep} /> {lang==='ar' ? 'دخول آمن' : 'Connexion sécurisée'}
        </div>
        <h1 className="dz-h1" style={{ margin: '0 0 8px' }}>{t('otp_title')}</h1>
        <p className="dz-body" style={{ color: T.ink2, margin: '0 0 26px' }}>{t('otp_sub')}</p>
        <div style={{ display: 'flex', gap: 9 }}>
          <div style={{ ...inputStyle, width: 76, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, justifyContent: 'center' }}>
            <span className="dz-mono" style={{ fontSize: 15 }}>+213</span>
          </div>
          <input autoFocus inputMode="tel" value={val} onChange={e => setVal(e.target.value)} placeholder={t('otp_phone_ph')}
            className="dz-mono" style={{ ...inputStyle, fontSize: 17, letterSpacing: '.04em' }} />
        </div>
      </div>
      <div style={{ paddingBottom: 28 }}>
        <Button full size="lg" disabled={!ok} iconRight="chevron" onClick={() => { setDraft({ phone: val }); go('otpcode'); }}
          style={{ opacity: ok ? 1 : .45 }}>{t('otp_continue')}</Button>
        <p className="dz-xs" style={{ color: T.ink4, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>{t('otp_terms')}</p>
      </div>
    </div>
  );
}

function OtpCode() {
  const { go, draft, t, lang } = useClient();
  const [digits, setDigits] = React.useState(['','','','','','']);
  const refs = React.useRef([]);
  const full = digits.every(d => d !== '');
  React.useEffect(() => { refs.current[0] && refs.current[0].focus(); }, []);
  React.useEffect(() => { if (full) { const id = setTimeout(() => go('kyc'), 480); return () => clearTimeout(id); } }, [full]);
  const set = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    setDigits(d => { const n = [...d]; n[i] = v; return n; });
    if (v && i < 5) refs.current[i+1] && refs.current[i+1].focus();
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 22px', background: T.sand }}>
      <CHeader title={t('otp_code_title')} onBack={() => go('otp')} sticky={false} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p className="dz-body" style={{ color: T.ink2, margin: '0 0 4px' }}>{t('otp_code_sub')}</p>
        <p className="dz-mono" style={{ fontSize: 16, fontWeight: 500, margin: '0 0 26px' }} dir="ltr">+213 {draft.phone || '•• •• •• ••'}</p>
        <div style={{ display: 'flex', gap: 9 }} dir="ltr">
          {digits.map((d, i) => (
            <input key={i} ref={el => refs.current[i] = el} value={d} inputMode="numeric" maxLength={1}
              onChange={e => set(i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i-1].focus(); }}
              className="dz-mono" style={{
                width: 46, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 500, borderRadius: 12,
                background: T.paper, color: T.ink, border: 'none', outline: 'none',
                boxShadow: `inset 0 0 0 ${d ? 2 : 1}px ${d ? T.primary : T.line2}`,
              }} />
          ))}
        </div>
        <button style={{ color: T.primary, fontWeight: 600, fontSize: 14, marginTop: 22, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="refresh" size={15} stroke={T.primary} /> {t('otp_resend')}
        </button>
      </div>
      <div style={{ paddingBottom: 28 }}>
        <Button full size="lg" disabled={!full} onClick={() => go('kyc')} style={{ opacity: full ? 1 : .45 }}>{t('otp_verify')}</Button>
      </div>
    </div>
  );
}

// ============== KYC ==============
function KycFlow() {
  const { go, draft, setDraft, t, lang } = useClient();
  const kyc = draft.kyc;
  const done = Object.values(kyc).filter(s => s !== 'none').length;
  const capture = (id) => setDraft(d => ({ kyc: { ...d.kyc, [id]: 'pending' } }));
  const submit = () => { go('home', true); };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <div style={{ flexShrink: 0, padding: '52px 22px 18px', background: T.primary, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Icon name="shield" size={22} stroke="#fff" />
          <span className="dz-label" style={{ color: 'rgba(255,255,255,.85)' }}>{t('kyc_progress').replace('documents','KYC')}</span>
        </div>
        <h1 className="dz-h1" style={{ color: '#fff', margin: '0 0 7px' }}>{t('kyc_title')}</h1>
        <p className="dz-sm" style={{ color: 'rgba(255,255,255,.85)', margin: 0 }}>{t('kyc_sub')}</p>
        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
          {KYC_DOCS.map((dc, i) => (
            <div key={dc.id} style={{ flex: 1, height: 4, borderRadius: 9, background: i < done ? '#fff' : 'rgba(255,255,255,.28)' }} />
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {KYC_DOCS.map(dc => (
          <DocUpload key={dc.id} doc={dc} status={kyc[dc.id]} onCapture={capture} t={t} lang={lang} />
        ))}
        <div style={{ height: 4 }} />
      </div>
      <div style={{ flexShrink: 0, padding: 16, paddingBottom: 22, background: T.paper, borderTop: `1px solid ${T.line2}`, boxShadow: T.shadowUp }}>
        {done > 0 && <div className="dz-xs" style={{ color: T.ink3, marginBottom: 10, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
          <Icon name="clock" size={14} stroke={T.status.pending.dot} style={{ marginTop: 1 }} /> {t('kyc_pending_note')}
        </div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={submit} style={{ boxShadow: `inset 0 0 0 1px ${T.line2}`, flexShrink: 0 }}>{t('kyc_skip')}</Button>
          <Button full disabled={done < 1} onClick={submit} style={{ opacity: done < 1 ? .45 : 1 }}>{t('kyc_submit')}</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ClientApp, ClientContext, useClient, CHeader, ClientNav, OtpPhone, OtpCode, KycFlow });
