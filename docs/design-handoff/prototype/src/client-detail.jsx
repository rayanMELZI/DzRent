// client-detail.jsx — CarDetail, Checkout, Contract, Payment.

const ADDONS = [
  { id: 'seat', icon: 'seat', key: 'co_addon_seat', price: 1500 },
  { id: 'gps', icon: 'pin', key: 'co_addon_gps', price: 1000 },
  { id: 'driver', icon: 'user', key: 'co_addon_driver', price: 2500 },
  { id: 'cdw', icon: 'shield', key: 'co_addon_cdw', price: 4000 },
];
function addonsTotal(addons) { return ADDONS.reduce((s, a) => s + (addons[a.id] ? a.price : 0), 0); }

// ============== CAR DETAIL ==============
function CarDetail() {
  const { go, draft, t, lang } = useClient();
  const car = carById(draft.carId);
  const agency = agencyById(draft.agencyId);
  const feats = FEATURES.slice(0, 5);
  const specs = [
    { ic: 'seat', label: t('car_seats'), val: car.seats },
    { ic: 'gauge', label: lang==='ar'?'علبة السرعة':'Boîte', val: car.trans === 'auto' ? t('car_trans_auto') : t('car_trans_man') },
    { ic: 'fuel', label: lang==='ar'?'الوقود':'Carburant', val: car.fuel === 'diesel' ? t('car_fuel_diesel') : t('car_fuel_essence') },
    { ic: 'calendar', label: t('car_year'), val: car.year },
  ];
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ position: 'relative' }}>
          <Placeholder label={`photo · ${car.fr}`} height={210} radius={0} />
          <button onClick={() => go('agency')} style={{ position: 'absolute', top: 14, insetInlineStart: 14, width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', boxShadow: T.shadow }}>
            <Icon name="back" size={19} stroke={T.ink} className="dz-flip" />
          </button>
          <div style={{ position: 'absolute', bottom: 12, insetInlineStart: 14, display: 'flex', gap: 6 }}>
            {[1,2,3].map(i => <span key={i} style={{ width: i===1?20:7, height: 7, borderRadius: 9, background: i===1?'#fff':'rgba(255,255,255,.55)' }} />)}
          </div>
        </div>
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <h1 className="dz-h1" style={{ margin: 0, fontSize: 23 }}>{car[lang]}</h1>
              <div className="dz-sm" style={{ color: T.ink3, marginTop: 4, textTransform: 'capitalize' }}>{CATEGORIES.find(c=>c.id===car.cat)[lang]} · {car.year}</div>
            </div>
            <StatusBadge status="approved" label={t('fleet_st_available')} />
          </div>

          {/* specs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 16 }}>
            {specs.map((s,i) => (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 8px', textAlign: 'center', boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
                <Icon name={s.ic} size={18} stroke={T.primary} style={{ margin: '0 auto' }} />
                <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>{s.val}</div>
                <div className="dz-xs" style={{ color: T.ink4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* features */}
          <h2 className="dz-h3" style={{ marginTop: 22, marginBottom: 10 }}>{t('car_features')}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {feats.map(f => (
              <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.paper, padding: '7px 11px', borderRadius: 999, fontSize: 12.5, color: T.ink2, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
                <Icon name="check" size={13} stroke={T.primary} sw={2.4} /> {f[lang]}
              </span>
            ))}
          </div>

          {/* agency snippet */}
          <h2 className="dz-h3" style={{ marginTop: 22, marginBottom: 10 }}>{t('car_by')}</h2>
          <button onClick={() => go('agency')} style={{ width: '100%', textAlign: 'start', background: T.paper, borderRadius: 14, padding: 13, boxShadow: `inset 0 0 0 1px ${T.line2}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Placeholder label="logo" height={46} radius={10} style={{ width: 46, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="dz-h3" style={{ fontSize: 14.5 }}>{agency[lang]}</span>
                {agency.verified && <VerifiedBadge size={15} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Stars value={agency.rating} size={12} />
                <span className="dz-xs" style={{ color: T.ink4 }}>· {agency.responseTime[lang]}</span>
              </div>
            </div>
            <Icon name="chevron" size={18} stroke={T.ink4} className="dz-flip" />
          </button>

          {/* reviews */}
          <h2 className="dz-h3" style={{ marginTop: 22, marginBottom: 10 }}>{agency.reviews} {t('ag_reviews')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[{ n: lang==='ar'?'سمير ب.':'Samir B.', r: 5, fr: 'Voiture impeccable, agence très pro. Caution rendue le jour même.', ar: 'سيارة ممتازة، وكالة محترفة جدًا. أُرجع الضمان في نفس اليوم.' },
              { n: lang==='ar'?'نادية ك.':'Nadia K.', r: 4, fr: 'Bon contact, papiers clairs. Je relouerai.', ar: 'تواصل جيد، وثائق واضحة. سأكرّر التجربة.' }].map((rv,i) => (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: 13, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{rv.n}</span>
                  <Stars value={rv.r} size={12} />
                </div>
                <p className="dz-sm" style={{ color: T.ink2, margin: '7px 0 0' }}>{rv[lang]}</p>
              </div>
            ))}
          </div>
          <div style={{ height: 12 }} />
        </div>
      </div>
      {/* sticky CTA */}
      <div style={{ flexShrink: 0, padding: 14, background: T.paper, borderTop: `1px solid ${T.line2}`, boxShadow: T.shadowUp, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div className="dz-mono" style={{ fontSize: 22, fontWeight: 600 }}>{fmtDZD(car.price)}<span className="dz-xs" style={{ color: T.ink4, fontWeight: 400 }}> {t('common_dzd')}{t('common_per_day')}</span></div>
          <div className="dz-xs" style={{ color: T.depositInk }}>{t('co_deposit')}: {fmtDZD(car.deposit)} {t('common_dzd')}</div>
        </div>
        <Button full size="lg" onClick={() => go('checkout')} iconRight="chevron">{t('car_book')}</Button>
      </div>
    </div>
  );
}

// ============== CHECKOUT ==============
function Checkout() {
  const { go, draft, setDraft, t, lang } = useClient();
  const car = carById(draft.carId);
  const addons = draft.addons || {};
  const toggle = (id) => setDraft(d => ({ addons: { ...d.addons, [id]: !d.addons[id] } }));
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <CHeader title={t('co_title')} onBack={() => go('car')} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* car mini */}
        <div style={{ display: 'flex', gap: 12, background: T.paper, borderRadius: 14, padding: 12, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
          <Placeholder label={`photo · ${car.fr}`} height={62} radius={10} style={{ width: 82, flexShrink: 0 }} />
          <div>
            <div className="dz-h3" style={{ fontSize: 15 }}>{car[lang]}</div>
            <div className="dz-xs" style={{ color: T.ink4, marginTop: 3 }}>{agencyById(draft.agencyId)[lang]}</div>
          </div>
        </div>

        {/* period */}
        <h2 className="dz-h3" style={{ margin: '20px 0 10px' }}>{t('co_period')}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 14, padding: '13px 15px', boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
          <Icon name="calendar" size={20} stroke={T.primary} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5 }} dir={lang==='ar'?'rtl':'ltr'}>{draft.from} → {draft.to}</div>
            <div className="dz-xs" style={{ color: T.ink4 }}>{draft.days} {t('co_days')}</div>
          </div>
        </div>

        {/* add-ons */}
        <h2 className="dz-h3" style={{ margin: '20px 0 10px' }}>{t('co_addons')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {ADDONS.map(a => {
            const on = !!addons[a.id];
            return (
              <button key={a.id} onClick={() => toggle(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.paper, borderRadius: 13, padding: '12px 14px', boxShadow: `inset 0 0 0 ${on?1.5:1}px ${on?T.primary:T.line2}`, textAlign: 'start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: on ? T.primarySoft : T.sand, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={a.icon} size={19} stroke={on ? T.primary : T.ink3} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t(a.key)}</div>
                  <div className="dz-xs dz-mono" style={{ color: T.ink4, marginTop: 2 }}>+{fmtDZD(a.price)} {t('common_dzd')}</div>
                </div>
                <span style={{ width: 24, height: 24, borderRadius: 999, display: 'grid', placeItems: 'center', background: on ? T.primary : 'transparent', boxShadow: on ? 'none' : `inset 0 0 0 1.5px ${T.line2}` }}>
                  {on && <Icon name="check" size={14} stroke="#fff" sw={2.6} />}
                </span>
              </button>
            );
          })}
        </div>

        {/* breakdown */}
        <h2 className="dz-h3" style={{ margin: '22px 0 10px' }}>{t('co_breakdown')}</h2>
        <PriceBreakdown pricePerDay={car.price} days={draft.days} addonsTotal={addonsTotal(addons)} deposit={car.deposit} t={t} lang={lang} />
        <div style={{ height: 8 }} />
      </div>
      <div style={{ flexShrink: 0, padding: 14, background: T.paper, borderTop: `1px solid ${T.line2}`, boxShadow: T.shadowUp }}>
        <Button full size="lg" iconRight="chevron" onClick={() => go('contract')}>{t('co_continue')}</Button>
      </div>
    </div>
  );
}

// ============== CONTRACT ==============
function Contract() {
  const { go, t, lang } = useClient();
  const [agreed, setAgreed] = React.useState(false);
  const [signed, setSigned] = React.useState(false);
  const clauses = ['ct_clause1','ct_clause2','ct_clause3'];
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <CHeader title={t('ct_title')} sub={t('ct_sub')} onBack={() => go('checkout')} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ background: T.paper, borderRadius: 14, padding: 16, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: `1px solid ${T.line3}`, marginBottom: 12 }}>
            <Icon name="doc" size={20} stroke={T.primary} />
            <span className="dz-mono" style={{ fontSize: 12.5, color: T.ink3 }}>DZ-RENT / CONTRAT-2026-08841</span>
          </div>
          {clauses.map((c, i) => (
            <div key={c} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <span className="dz-mono" style={{ color: T.clay, fontSize: 13, fontWeight: 500, flexShrink: 0 }}>{String(i+1).padStart(2,'0')}</span>
              <p className="dz-sm" style={{ margin: 0, color: T.ink2, lineHeight: 1.55 }}>{t(c)}</p>
            </div>
          ))}
        </div>

        {/* signature */}
        <h2 className="dz-h3" style={{ margin: '20px 0 10px' }}>{t('ct_sign')}</h2>
        <SignaturePad onSign={setSigned} t={t} />

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginTop: 16, cursor: 'pointer' }} onClick={() => setAgreed(v => !v)}>
          <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'grid', placeItems: 'center', background: agreed ? T.primary : T.paper, boxShadow: agreed ? 'none' : `inset 0 0 0 1.5px ${T.line2}`, marginTop: 1 }}>
            {agreed && <Icon name="check" size={15} stroke="#fff" sw={2.6} />}
          </span>
          <span className="dz-sm" style={{ color: T.ink2 }}>{t('ct_agree')}</span>
        </label>
        <div style={{ height: 8 }} />
      </div>
      <div style={{ flexShrink: 0, padding: 14, background: T.paper, borderTop: `1px solid ${T.line2}`, boxShadow: T.shadowUp }}>
        <Button full size="lg" iconRight="chevron" disabled={!agreed || !signed} onClick={() => go('payment')} style={{ opacity: (agreed && signed) ? 1 : .45 }}>{t('ct_continue')}</Button>
      </div>
    </div>
  );
}

function SignaturePad({ onSign, t }) {
  const ref = React.useRef(null);
  const drawing = React.useRef(false);
  const [has, setHas] = React.useState(false);
  React.useEffect(() => {
    const c = ref.current; const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; ctx.scale(dpr, dpr);
    ctx.strokeStyle = T.ink; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }, []);
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return { x: p.clientX - r.left, y: p.clientY - r.top }; };
  const start = (e) => { drawing.current = true; const ctx = ref.current.getContext('2d'); const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e) => { if (!drawing.current) return; e.preventDefault(); const ctx = ref.current.getContext('2d'); const { x, y } = pos(e); ctx.lineTo(x, y); ctx.stroke(); if (!has) { setHas(true); onSign(true); } };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = ref.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); setHas(false); onSign(false); };
  return (
    <div style={{ background: T.paper, borderRadius: 14, padding: 12, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
      <div style={{ position: 'relative', background: T.sand, borderRadius: 10, border: `1.5px dashed ${T.line2}` }}>
        <canvas ref={ref} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          style={{ width: '100%', height: 120, display: 'block', touchAction: 'none' }} />
        {!has && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.ink4, fontSize: 13 }}><Icon name="sign" size={18} stroke={T.ink4} />{t('ct_sign')}</span>
        </div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={clear} style={{ color: T.ink3, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="refresh" size={14} stroke={T.ink3} />{t('ct_clear')}</button>
      </div>
    </div>
  );
}

Object.assign(window, { CarDetail, Checkout, Contract, SignaturePad, ADDONS, addonsTotal });
