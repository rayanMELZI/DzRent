// client-confirm.jsx — Payment, Confirmation/Active, Trips, Docs, Profile.

function computeTotals(car, days, addons) {
  const sub = car.price * days + addonsTotal(addons || {});
  const insurance = 800 * days;
  const tva = Math.round(sub * 0.19);
  return { total: sub + tva + insurance, deposit: car.deposit };
}

// ============== PAYMENT ==============
function Payment() {
  const { go, draft, setDraft, t, lang } = useClient();
  const store = useStore();
  const car = carById(draft.carId);
  const [method, setMethod] = React.useState(draft.payMethod || 'cib');
  const { total, deposit } = computeTotals(car, draft.days, draft.addons);

  const methods = [
    { id: 'cib', icon: 'card', label: t('pay_cib'), tone: T.primary },
    { id: 'edahabia', icon: 'card', label: t('pay_edahabia'), tone: '#B58A2E' },
    { id: 'cash', icon: 'cash', label: t('pay_cash'), tone: T.clay },
  ];

  const submit = () => {
    const id = store.addRequest({
      customer: {
        name: lang==='ar' ? 'أمين بلقاسم' : 'Amine Belkacem', phone: '+213 ' + (draft.phone || '661 00 00 00'), initials: 'AB',
        joined: 'juin 2026', rentals: 0, kyc: { ...draft.kyc },
        blacklisted: false,
        riskFlags: draft.kyc.selfie === 'refused' ? [{ fr: 'Selfie à revoir', ar: 'الصورة تحتاج مراجعة' }] : [],
      },
      car: car.id, agency: draft.agencyId, from: draft.from, to: draft.to, days: draft.days,
      total, deposit, payMethod: method,
    });
    setDraft({ payMethod: method, bookingId: id });
    go('confirm', true);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <CHeader title={t('pay_title')} sub={t('pay_sub')} onBack={() => go('contract')} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {methods.map(m => {
            const on = method === m.id;
            return (
              <button key={m.id} onClick={() => setMethod(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, background: T.paper, borderRadius: 14, padding: '14px 15px', boxShadow: `inset 0 0 0 ${on?2:1}px ${on?m.tone:T.line2}`, textAlign: 'start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: on ? m.tone : T.sand, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={m.icon} size={21} stroke={on ? '#fff' : T.ink3} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{m.label}</div>
                  {m.id === 'cash' && <div className="dz-xs" style={{ color: T.ink4, marginTop: 2 }}>{t('pay_cash_note')}</div>}
                </div>
                <span style={{ width: 22, height: 22, borderRadius: 999, display: 'grid', placeItems: 'center', background: on ? m.tone : 'transparent', boxShadow: on ? 'none' : `inset 0 0 0 1.5px ${T.line2}` }}>
                  {on && <Icon name="check" size={13} stroke="#fff" sw={2.8} />}
                </span>
              </button>
            );
          })}
        </div>

        {/* card form */}
        {method !== 'cash' && (
          <div className="dz-enter" style={{ marginTop: 16, background: T.paper, borderRadius: 14, padding: 16, boxShadow: `inset 0 0 0 1px ${T.line2}`, display: 'flex', flexDirection: 'column', gap: 13 }}>
            <Field label={t('pay_card_num')}>
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 9 }} className="dz-mono">
                <Icon name="card" size={18} stroke={T.ink4} />
                <span style={{ letterSpacing: '.08em', color: T.ink3 }}>•••• •••• •••• 4471</span>
              </div>
            </Field>
            <div style={{ display: 'flex', gap: 11 }}>
              <Field label={t('pay_card_exp')}><div style={{ ...inputStyle }} className="dz-mono">08/28</div></Field>
              <Field label={t('pay_card_cvv')}><div style={{ ...inputStyle }} className="dz-mono">•••</div></Field>
            </div>
          </div>
        )}

        {/* deposit hold note */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 9, background: T.depositBg, border: `1.5px dashed ${T.depositLine}`, borderRadius: 12, padding: '11px 13px', color: T.depositInk }}>
          <Icon name="lock" size={17} stroke={T.depositInk} />
          <span className="dz-sm" style={{ fontWeight: 500 }}>{t('pay_deposit_hold')} · </span>
          <span className="dz-mono" style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtDZD(deposit)} {t('common_dzd')}</span>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: 14, background: T.paper, borderTop: `1px solid ${T.line2}`, boxShadow: T.shadowUp }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 11 }}>
          <span className="dz-sm" style={{ color: T.ink3 }}>{t('co_total')}</span>
          <span className="dz-mono" style={{ fontSize: 20, fontWeight: 600 }}>{fmtDZD(total)} <span style={{ fontSize: 12, color: T.ink4 }}>{t('common_dzd')}</span></span>
        </div>
        <Button full size="lg" icon={method === 'cash' ? 'check' : 'lock'} onClick={submit}>
          {method === 'cash' ? t('pay_confirm_cash') : `${t('pay_now')} ${fmtDZD(total)} ${t('common_dzd')}`}
        </Button>
      </div>
    </div>
  );
}

// ============== CONFIRMATION / ACTIVE ==============
function Confirmation() {
  const { go, draft, resetTo, t, lang } = useClient();
  const store = useStore();
  const req = store.requests.find(r => r.id === draft.bookingId);
  const car = carById(draft.carId);
  const agency = agencyById(draft.agencyId);
  const status = req ? req.status : 'pending';

  if (status === 'approved') return <ActiveRental car={car} agency={agency} draft={draft} go={go} resetTo={resetTo} t={t} lang={lang} />;
  if (status === 'refused') return <RefusedBooking agency={agency} resetTo={resetTo} t={t} lang={lang} />;

  // pending
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>
        <div style={{ padding: '56px 22px 30px', textAlign: 'center', background: T.primary, color: '#fff', borderRadius: '0 0 24px 24px' }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="clock" size={34} stroke="#fff" sw={1.8} />
          </div>
          <h1 className="dz-h1" style={{ color: '#fff', margin: '0 0 8px' }}>{t('cf_sent')}</h1>
          <p className="dz-sm" style={{ color: 'rgba(255,255,255,.85)', margin: '0 auto', maxWidth: 280 }}>{t('cf_sent_sub')}</p>
        </div>

        <div style={{ padding: 16 }}>
          {/* live status */}
          <div style={{ background: T.paper, borderRadius: 16, padding: 16, boxShadow: T.shadow }}>
            <div className="dz-label" style={{ color: T.ink4, marginBottom: 12 }}>{t('cf_status')}</div>
            <Timeline step={1} t={t} lang={lang} />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: T.status.pending.bg, color: T.status.pending.ink, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: T.status.pending.dot }} className="dz-pulse" />
              {t('cf_waiting')} · {agency[lang]}
            </div>
          </div>

          <BookingSummary car={car} agency={agency} draft={draft} t={t} lang={lang} />

          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <Button variant="ghost" full onClick={() => go('contract')} icon="doc" style={{ boxShadow: `inset 0 0 0 1px ${T.line2}` }}>{t('cf_view_contract')}</Button>
            <Button variant="soft" full onClick={() => resetTo('home')} icon="home">{t('cf_home')}</Button>
          </div>
          <p className="dz-xs" style={{ textAlign: 'center', color: T.ink4, marginTop: 14 }}>
            {lang==='ar' ? 'نصيحة: بدّل إلى واجهة «الوكالة» للموافقة على هذا الطلب.' : 'Astuce : passez à la surface « Agence » pour approuver cette demande.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function Timeline({ step, t, lang }) {
  const steps = [
    { fr: 'Demande envoyée', ar: 'أُرسل الطلب' },
    { fr: 'Vérification agence', ar: 'تحقق الوكالة' },
    { fr: 'Réservation confirmée', ar: 'تأكيد الحجز' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((s, i) => {
        const done = i < step, active = i === step;
        return (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, display: 'grid', placeItems: 'center', flexShrink: 0,
                background: done ? T.primary : active ? T.status.pending.bg : T.sand,
                boxShadow: active ? `inset 0 0 0 2px ${T.status.pending.dot}` : done ? 'none' : `inset 0 0 0 1.5px ${T.line2}` }}>
                {done ? <Icon name="check" size={13} stroke="#fff" sw={2.8} /> : active ? <span style={{ width: 7, height: 7, borderRadius: 9, background: T.status.pending.dot }} /> : null}
              </span>
              {i < steps.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 22, background: done ? T.primary : T.line2 }} />}
            </div>
            <div style={{ paddingBottom: i < steps.length - 1 ? 14 : 0, paddingTop: 1 }}>
              <div style={{ fontSize: 14, fontWeight: active || done ? 600 : 400, color: active || done ? T.ink : T.ink4 }}>{s[lang]}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BookingSummary({ car, agency, draft, t, lang }) {
  return (
    <div style={{ marginTop: 14, background: T.paper, borderRadius: 16, padding: 14, boxShadow: T.shadow }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Placeholder label={`photo · ${car.fr}`} height={62} radius={10} style={{ width: 82, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="dz-h3" style={{ fontSize: 15 }}>{car[lang]}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <span className="dz-xs" style={{ color: T.ink4 }}>{agency[lang]}</span>
            {agency.verified && <VerifiedBadge size={13} />}
          </div>
          <div className="dz-sm dz-mono" style={{ color: T.ink2, marginTop: 6 }} dir={lang==='ar'?'rtl':'ltr'}>{draft.from} → {draft.to}</div>
        </div>
      </div>
    </div>
  );
}

function ActiveRental({ car, agency, draft, go, resetTo, t, lang }) {
  const [left, setLeft] = React.useState('');
  React.useEffect(() => {
    const end = Date.now() + draft.days * 86400000 - 3600000;
    const tick = () => {
      const ms = Math.max(0, end - Date.now());
      const d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
      setLeft(`${d}j ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        <div style={{ padding: '52px 20px 26px', background: T.primary, color: '#fff', borderRadius: '0 0 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <StatusBadge status="approved" label={t('cf_active')} />
            <span className="dz-xs" style={{ color: 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="check" size={14} stroke="#fff" sw={2.4} />{t('cf_approved_by')} {agency[lang]}
            </span>
          </div>
          <div style={{ textAlign: 'center', margin: '20px 0 4px' }}>
            <div className="dz-label" style={{ color: 'rgba(255,255,255,.75)', marginBottom: 8 }}>{t('cf_time_left')}</div>
            <div className="dz-mono" style={{ fontSize: 34, fontWeight: 600, letterSpacing: '.02em' }}>{left}</div>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          {/* vehicle status (no live GPS for client) */}
          <div style={{ background: T.paper, borderRadius: 16, padding: 14, boxShadow: T.shadow }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Placeholder label={`photo · ${car.fr}`} height={66} radius={11} style={{ width: 90, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="dz-h3" style={{ fontSize: 15 }}>{car[lang]}</div>
                <div className="dz-label" style={{ color: T.ink4, marginTop: 6 }}>{t('cf_your_vehicle')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9, background: T.status.approved.dot }} />
                  <span className="dz-sm" style={{ fontWeight: 600, color: T.status.approved.ink }}>{t('cf_on_road')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* pickup + code */}
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: T.paper, borderRadius: 14, padding: 14, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
              <div className="dz-label" style={{ color: T.ink4 }}>{t('cf_pickup')}</div>
              <div className="dz-sm" style={{ fontWeight: 600, marginTop: 6, display: 'flex', gap: 5, alignItems: 'center' }}><Icon name="pin" size={15} stroke={T.primary} />{agency.commune[lang]}</div>
            </div>
            <div style={{ flex: 1, background: T.paper, borderRadius: 14, padding: 14, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
              <div className="dz-label" style={{ color: T.ink4 }}>{t('cf_code')}</div>
              <div className="dz-mono" style={{ fontWeight: 600, marginTop: 4, fontSize: 19, letterSpacing: '.1em', color: T.clay }}>7K2-91</div>
            </div>
          </div>

          <DepositBox deposit={draft.deposit || carById(draft.carId).deposit} t={t} />

          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <Button variant="ghost" full onClick={() => go('contract')} icon="doc" style={{ boxShadow: `inset 0 0 0 1px ${T.line2}` }}>{t('cf_view_contract')}</Button>
            <Button variant="soft" full onClick={() => resetTo('home')} icon="home">{t('cf_home')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefusedBooking({ agency, resetTo, t, lang }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 999, background: T.status.refused.bg, display: 'grid', placeItems: 'center', marginBottom: 18 }}>
          <Icon name="x" size={32} stroke={T.status.refused.ink} sw={2.2} />
        </div>
        <h1 className="dz-h1" style={{ margin: '0 0 8px' }}>{lang==='ar' ? 'رُفض الطلب' : 'Demande refusée'}</h1>
        <p className="dz-body" style={{ color: T.ink2, maxWidth: 280, margin: '0 0 24px' }}>
          {lang==='ar' ? `لم تقبل ${agency.ar} هذا الطلب. لا خصم من بطاقتك.` : `${agency.fr} n'a pas approuvé cette demande. Aucun montant n'a été débité.`}
        </p>
        <Button onClick={() => resetTo('home')} icon="home">{t('cf_home')}</Button>
      </div>
    </div>
  );
}

// ============== TRIPS / DOCS / PROFILE ==============
function TripsScreen() {
  const { draft, go, t, lang } = useClient();
  const store = useStore();
  const mine = store.requests.find(r => r.id === draft.bookingId);
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: T.sand }}>
      <div style={{ padding: '46px 18px 14px' }}><h1 className="dz-h1">{t('nav_trips')}</h1></div>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mine ? (
          <button onClick={() => go('confirm')} style={{ textAlign: 'start', width: '100%' }}>
            <TripRow req={mine} t={t} lang={lang} />
          </button>
        ) : <EmptyState icon="car" label={lang==='ar'?'لا حجوزات بعد':'Aucune location pour l\'instant'} />}
        <TripRow past t={t} lang={lang} />
      </div>
    </div>
  );
}
function TripRow({ req, past, t, lang }) {
  const car = carById(past ? 'sandero' : req.car);
  const agency = agencyById(past ? 'medina' : req.agency);
  const st = past ? 'none' : req.status;
  return (
    <div style={{ background: T.paper, borderRadius: 16, padding: 13, boxShadow: T.shadow, display: 'flex', gap: 12 }}>
      <Placeholder label={`photo · ${car.fr}`} height={66} radius={11} style={{ width: 88, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span className="dz-h3" style={{ fontSize: 14.5 }}>{car[lang]}</span>
          <StatusBadge status={past ? 'approved' : st === 'approved' ? 'approved' : st === 'refused' ? 'refused' : 'pending'} size="sm" label={past ? (lang==='ar'?'منتهٍ':'Terminée') : undefined} t={t} />
        </div>
        <div className="dz-xs" style={{ color: T.ink4, marginTop: 4 }}>{agency[lang]}</div>
        <div className="dz-sm dz-mono" style={{ color: T.ink2, marginTop: 6 }} dir={lang==='ar'?'rtl':'ltr'}>{past ? '12 → 15 juin' : `${req.from} → ${req.to}`}</div>
      </div>
    </div>
  );
}

function DocsScreen() {
  const { draft, t, lang } = useClient();
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: T.sand }}>
      <div style={{ padding: '46px 18px 14px' }}><h1 className="dz-h1">{t('nav_docs')}</h1></div>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {KYC_DOCS.map(dc => (
          <div key={dc.id} style={{ background: T.paper, borderRadius: 14, padding: 14, boxShadow: `inset 0 0 0 1px ${T.line2}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: T.sand, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="doc" size={20} stroke={T.primary} /></div>
            <div style={{ flex: 1 }}>
              <div className="dz-h3" style={{ fontSize: 14.5 }}>{dc[lang]}</div>
            </div>
            <StatusBadge status={draft.kyc[dc.id] || 'none'} size="sm" t={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen() {
  const { draft, t, lang } = useClient();
  const items = [
    { ic: 'user', fr: 'Informations personnelles', ar: 'المعلومات الشخصية' },
    { ic: 'doc', fr: 'Documents', ar: 'الوثائق' },
    { ic: 'card', fr: 'Moyens de paiement', ar: 'وسائل الدفع' },
    { ic: 'shield', fr: 'Sécurité & confidentialité', ar: 'الأمان والخصوصية' },
  ];
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: T.sand }}>
      <div style={{ padding: '46px 18px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: 999, background: T.primary, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 600, fontSize: 22 }}>AB</div>
        <div>
          <div className="dz-h2">{lang==='ar'?'أمين بلقاسم':'Amine Belkacem'}</div>
          <div className="dz-sm dz-mono" style={{ color: T.ink3 }} dir="ltr">+213 {draft.phone || '661 •• •• ••'}</div>
        </div>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((it, i) => (
          <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 12px', borderRadius: 12, background: T.paper, marginBottom: 8, boxShadow: `inset 0 0 0 1px ${T.line2}`, textAlign: 'start' }}>
            <Icon name={it.ic} size={20} stroke={T.primary} />
            <span style={{ flex: 1, fontWeight: 500, fontSize: 14.5 }}>{it[lang]}</span>
            <Icon name="chevron" size={18} stroke={T.ink4} className="dz-flip" />
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px', color: T.ink4 }}>
      <Icon name={icon} size={34} stroke={T.ink4} style={{ margin: '0 auto 12px' }} />
      <div className="dz-body">{label}</div>
    </div>
  );
}

Object.assign(window, { Payment, Confirmation, ActiveRental, RefusedBooking, Timeline, BookingSummary, TripsScreen, DocsScreen, ProfileScreen, EmptyState, computeTotals });
