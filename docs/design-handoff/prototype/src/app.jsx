// app.jsx — root shell: language + RTL, surface switcher, both surfaces share one store.

function LangProvider({ children }) {
  const [lang, setLang] = React.useState('fr');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = React.useCallback((k) => (STR[k] ? STR[k][lang] : k), [lang]);
  return React.createElement(LangContext.Provider, { value: { lang, dir, setLang, t } }, children);
}

function TopBar({ view, setView }) {
  const { lang, setLang, t } = useLang();
  const views = [
    { id: 'both', fr: 'Côte à côte', ar: 'جنبًا إلى جنب', icon: 'grid' },
    { id: 'client', fr: 'Client', ar: 'الزبون', icon: 'phone' },
    { id: 'agency', fr: 'Agence', ar: 'الوكالة', icon: 'building' },
  ];
  return (
    <div dir="ltr" style={{
      height: 58, flexShrink: 0, background: T.paper, borderBottom: `1px solid ${T.line2}`,
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: T.primary, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>D</div>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.02em' }}>DzRent</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.ink4, background: T.sand, padding: '3px 7px', borderRadius: 6, letterSpacing: '.04em' }}>PROTOTYPE</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* surface switch */}
      <div style={{ display: 'flex', gap: 2, background: T.sand, borderRadius: 10, padding: 3 }}>
        {views.map(v => {
          const on = view === v.id;
          return (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: on ? T.paper : 'transparent', color: on ? T.ink : T.ink3, boxShadow: on ? T.shadow : 'none',
            }}>
              <Icon name={v.icon} size={16} stroke={on ? T.primary : T.ink4} />
              {lang === 'ar' ? v.ar : v.fr}
            </button>
          );
        })}
      </div>

      {/* language toggle */}
      <div style={{ display: 'flex', gap: 2, background: T.sand, borderRadius: 10, padding: 3 }}>
        {[{ id: 'fr', label: 'FR' }, { id: 'ar', label: 'العربية' }].map(l => {
          const on = lang === l.id;
          return (
            <button key={l.id} onClick={() => setLang(l.id)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: on ? T.primary : 'transparent', color: on ? '#fff' : T.ink3,
              fontFamily: l.id === 'ar' ? T.arabic : T.sans,
            }}>{l.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = React.useState('both');
  return (
    <LangProvider>
      <StoreProvider>
        <Stage view={view} setView={setView} />
      </StoreProvider>
    </LangProvider>
  );
}

function Stage({ view, setView }) {
  const { dir, lang } = useLang();
  const showClient = view === 'both' || view === 'client';
  const showAgency = view === 'both' || view === 'agency';
  const wrapRef = React.useRef(null);
  const rowRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  const [box, setBox] = React.useState({ w: 0, h: 0 });

  React.useLayoutEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current, row = rowRef.current;
      if (!wrap || !row) return;
      const padH = 40, padW = 48;
      const availH = wrap.clientHeight - padH;
      const availW = wrap.clientWidth - padW;
      // measure intrinsic (unscaled) content size
      const ch = row.offsetHeight, cw = row.offsetWidth;
      if (ch < 50 || cw < 50) return;
      const s = Math.max(0.2, Math.min(1, availH / ch, availW / cw));
      setScale(s);
      setBox({ w: cw * s, h: ch * s });
    };
    fit();
    const raf = requestAnimationFrame(fit);
    const t1 = setTimeout(fit, 250);
    const t2 = setTimeout(fit, 700);
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (rowRef.current) ro.observe(rowRef.current);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); ro.disconnect(); };
  }, [view, lang]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.canvas }}>
      <TopBar view={view} setView={setView} />
      <div ref={wrapRef} dir={dir} style={{
        flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ width: box.w || 'auto', height: box.h || 'auto', flexShrink: 0, position: 'relative' }}>
          <div ref={rowRef} style={{
            display: 'flex', alignItems: 'flex-start', gap: 48, position: 'absolute', top: 0, insetInlineStart: 0,
            transform: `scale(${scale})`, transformOrigin: dir === 'rtl' ? 'top right' : 'top left',
          }}>
          {showClient && (
            <div style={{ flexShrink: 0 }}>
              <PhoneFrame label={lang === 'ar' ? 'تطبيق الزبون · PWA' : 'Client · PWA'}>
                <ClientApp />
                <ToastMount surface="client" />
              </PhoneFrame>
            </div>
          )}
          {showAgency && (
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <BrowserFrame label={lang === 'ar' ? 'لوحة الوكالة' : 'Dashboard Agence'} url="pro.dzrent.dz">
                <AgencyApp />
              </BrowserFrame>
              <AgencyToast />
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

// toast lives at surface level (positioned within phone for client)
function ToastMount({ surface }) {
  const store = useStore();
  if (surface === 'client') return <Toast toast={store.toast} />;
  return null;
}

// agency toast — bottom-center of the dashboard frame
function AgencyToast() {
  const store = useStore();
  if (!store.toast) return null;
  const tone = store.toast.tone === 'err' ? T.status.refused.ink : T.primary;
  return (
    <div className="dz-pop" style={{
      position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)',
      background: tone, color: '#fff', padding: '12px 20px', borderRadius: 12,
      fontSize: 14, fontWeight: 500, boxShadow: '0 10px 30px rgba(0,0,0,.28)', zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap',
    }}>
      <Icon name={store.toast.tone === 'err' ? 'alert' : 'check'} size={17} stroke="#fff" sw={2.4} />
      {store.toast.msg}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
Object.assign(window, { App, Stage, TopBar, LangProvider });
