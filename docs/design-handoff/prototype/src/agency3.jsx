// agency3.jsx — FleetMap (dispatch/ops), Revenue, Staff.

// ============== FLEET GPS MAP (dispatch / ops) ==============
const MAP_UNITS = [
  { id: 'm1', car: 'tucson', plate: '00937', x: 38, y: 42, state: 'ok', speed: 48 },
  { id: 'm2', car: 'logan', plate: '00412', x: 60, y: 30, state: 'speed', speed: 132 },
  { id: 'm3', car: 'accent', plate: '01188', x: 27, y: 64, state: 'ok', speed: 0 },
  { id: 'm4', car: 'golf', plate: '02051', x: 82, y: 70, state: 'geofence', speed: 71 },
  { id: 'm5', car: 'classec', plate: '00076', x: 52, y: 58, state: 'ok', speed: 22 },
];
const MAP_STATE = {
  ok: { color: '#4EC79A', key: null },
  speed: { color: '#E08A4A', label: { fr: 'Excès de vitesse', ar: 'تجاوز السرعة' } },
  geofence: { color: '#E0675B', label: { fr: 'Hors geofence', ar: 'خارج المنطقة' } },
};

function FleetMap() {
  const { t, lang } = useAgency();
  const [sel, setSel] = React.useState('m2');
  const alerts = MAP_UNITS.filter(u => u.state !== 'ok');
  return (
    <div style={{ display: 'flex', gap: 16, height: '100%', minHeight: 0 }}>
      {/* map */}
      <div style={{ flex: 1, minWidth: 0, borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: T.shadow,
        background: '#10221E',
        backgroundImage: `radial-gradient(circle at 30% 20%, #163029 0, #0E1C19 60%),
          repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 64px),
          repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px 64px)` }}>
        {/* roads */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
          <path d="M0,180 Q260,120 520,260 T1000,300" stroke="rgba(255,255,255,.07)" strokeWidth="22" fill="none" />
          <path d="M180,0 L320,640" stroke="rgba(255,255,255,.06)" strokeWidth="16" fill="none" />
          <path d="M700,0 Q760,300 640,640" stroke="rgba(255,255,255,.06)" strokeWidth="18" fill="none" />
        </svg>
        {/* geofence boundary */}
        <div style={{ position: 'absolute', inset: '12% 14%', border: `2px dashed rgba(78,199,154,.5)`, borderRadius: 26, background: 'rgba(78,199,154,.05)' }}>
          <span className="dz-label" style={{ position: 'absolute', top: 10, insetInlineStart: 14, color: 'rgba(78,199,154,.8)', fontSize: 10 }}>{lang==='ar'?'منطقة مرخصة':'Zone autorisée'}</span>
        </div>
        {/* pins */}
        {MAP_UNITS.map(u => {
          const s = MAP_STATE[u.state]; const car = carById(u.car); const on = sel === u.id;
          return (
            <button key={u.id} onClick={() => setSel(u.id)} style={{ position: 'absolute', left: `${u.x}%`, top: `${u.y}%`, transform: 'translate(-50%,-50%)', zIndex: on ? 5 : 2 }}>
              {u.state !== 'ok' && <span style={{ position: 'absolute', inset: -8, borderRadius: 999, background: s.color, opacity: .3 }} className="dz-pulse" />}
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, background: on ? '#fff' : 'rgba(16,28,25,.85)', boxShadow: `0 2px 10px rgba(0,0,0,.4), 0 0 0 ${on?2:1.5}px ${s.color}`, borderRadius: 999, padding: '5px 10px 5px 6px' }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: s.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="car" size={13} stroke="#10221E" sw={2} /></span>
                <span className="dz-mono" style={{ fontSize: 11, fontWeight: 600, color: on ? T.ink : '#fff' }}>{u.plate}</span>
              </span>
            </button>
          );
        })}
        {/* legend */}
        <div style={{ position: 'absolute', bottom: 14, insetInlineStart: 14, display: 'flex', gap: 14, background: 'rgba(16,28,25,.8)', backdropFilter: 'blur(6px)', padding: '9px 14px', borderRadius: 11 }}>
          {Object.entries(MAP_STATE).map(([k, s]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'rgba(255,255,255,.85)', fontWeight: 500 }}>
              <span style={{ width: 9, height: 9, borderRadius: 9, background: s.color }} />
              {k === 'ok' ? (lang==='ar'?'سليم':'Normal') : s.label[lang]}
            </span>
          ))}
        </div>
      </div>

      {/* side panel */}
      <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <div style={{ background: T.paper, borderRadius: 14, padding: 16, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><div className="dz-mono" style={{ fontSize: 24, fontWeight: 600 }}>{MAP_UNITS.length}</div><div className="dz-xs" style={{ color: T.ink4 }}>{lang==='ar'?'مركبات نشطة':'véhicules actifs'}</div></div>
            <div style={{ flex: 1 }}><div className="dz-mono" style={{ fontSize: 24, fontWeight: 600, color: T.clay }}>{alerts.length}</div><div className="dz-xs" style={{ color: T.ink4 }}>{lang==='ar'?'تنبيهات':'alertes'}</div></div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {MAP_UNITS.map(u => {
            const s = MAP_STATE[u.state]; const car = carById(u.car); const on = sel === u.id;
            return (
              <button key={u.id} onClick={() => setSel(u.id)} style={{ textAlign: 'start', background: T.paper, borderRadius: 12, padding: 13, boxShadow: on ? `inset 0 0 0 2px ${T.primary}` : T.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: s.color + '22', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="car" size={18} stroke={s.color === '#4EC79A' ? T.primary : s.color} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{car[lang]}</div>
                    <div className="dz-mono" style={{ fontSize: 11, color: T.ink4 }}>{u.plate}-114-16</div>
                  </div>
                  <div style={{ textAlign: lang==='ar'?'left':'right' }}>
                    <div className="dz-mono" style={{ fontSize: 14, fontWeight: 600, color: u.state === 'speed' ? T.clay : T.ink }}>{u.speed}<span style={{ fontSize: 9, color: T.ink4 }}> km/h</span></div>
                  </div>
                </div>
                {u.state !== 'ok' && <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: s.color === '#E08A4A' ? T.clay : T.status.refused.ink }}><Icon name="alert" size={14} stroke={s.color === '#E08A4A' ? T.clay : T.status.refused.ink} />{s.label[lang]}</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============== REVENUE ==============
function RevenueScreen() {
  const { t, lang } = useAgency();
  const [period, setPeriod] = React.useState('m');
  const byCat = [
    { id: 'suv', v: 642 }, { id: 'berline', v: 488 }, { id: 'prestige', v: 410 },
    { id: 'citadine', v: 196 }, { id: 'minivan', v: 106 },
  ];
  const max = Math.max(...byCat.map(c => c.v));
  const months = [320, 410, 380, 520, 470, 610, 580, 690, 640, 720, 1842/2, 1842];
  const mmax = Math.max(...months);
  return (
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 7 }}>
        {[{ id: 'w', fr: 'Semaine', ar: 'أسبوع' }, { id: 'm', fr: 'Mois', ar: 'شهر' }, { id: 'y', fr: 'Année', ar: 'سنة' }].map(p =>
          <Chip key={p.id} active={period === p.id} onClick={() => setPeriod(p.id)}>{p[lang]}</Chip>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[{ l: t('kpi_revenue'), v: '1 842 000', u: t('common_dzd'), tr: '+12%' },
          { l: lang==='ar'?'عدد الحجوزات':'Locations', v: '64', tr: '+8%' },
          { l: lang==='ar'?'متوسط القيمة':'Panier moyen', v: '28 800', u: t('common_dzd'), tr: '+4%' }].map((k,i) => (
          <div key={i} style={{ background: T.paper, borderRadius: 14, padding: 18, boxShadow: T.shadow }}>
            <div className="dz-sm" style={{ color: T.ink3 }}>{k.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
              <span className="dz-mono" style={{ fontSize: 25, fontWeight: 600 }}>{k.v}</span>
              {k.u && <span className="dz-xs" style={{ color: T.ink4 }}>{k.u}</span>}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.status.approved.ink, background: T.status.approved.bg, padding: '3px 8px', borderRadius: 999, marginTop: 8, display: 'inline-block' }}>{k.tr}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        {/* monthly trend */}
        <div style={{ background: T.paper, borderRadius: 16, padding: 20, boxShadow: T.shadow }}>
          <h3 className="dz-h3" style={{ marginBottom: 18 }}>{lang==='ar'?'الإيراد الشهري':'Revenu mensuel'} <span className="dz-xs" style={{ color: T.ink4, fontWeight: 400 }}>(k {t('common_dzd')})</span></h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 160 }}>
            {months.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', height: `${m/mmax*100}%`, borderRadius: '5px 5px 0 0', background: i === months.length - 1 ? T.clay : T.primary, opacity: i === months.length - 1 ? 1 : .8 - (months.length-1-i)*0.03 }} />
              </div>
            ))}
          </div>
        </div>
        {/* by category */}
        <div style={{ background: T.paper, borderRadius: 16, padding: 20, boxShadow: T.shadow }}>
          <h3 className="dz-h3" style={{ marginBottom: 18 }}>{lang==='ar'?'حسب الفئة':'Par catégorie'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {byCat.map(c => {
              const cat = CATEGORIES.find(x => x.id === c.id);
              return (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ fontWeight: 500 }}>{cat[lang]}</span>
                    <span className="dz-mono" style={{ color: T.ink3 }}>{c.v}k</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 9, background: T.sand }}><div style={{ width: `${c.v/max*100}%`, height: '100%', borderRadius: 9, background: T.primary }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== STAFF ==============
function StaffScreen() {
  const { t, lang } = useAgency();
  const staff = [
    { initials: 'SK', name: 'Sofiane Kaci', role: { fr: 'Gérant', ar: 'المسير' }, perms: ['fleet','requests','blacklist','revenue'], owner: true },
    { initials: 'NB', name: 'Nawel Brahimi', role: { fr: 'Agent comptoir', ar: 'موظف استقبال' }, perms: ['requests','fleet'] },
    { initials: 'YH', name: 'Yanis Haddad', role: { fr: 'Responsable flotte', ar: 'مسؤول الأسطول' }, perms: ['fleet','map'] },
  ];
  const PERMS = { fleet: { fr: 'Flotte', ar: 'الأسطول' }, requests: { fr: 'Demandes', ar: 'الطلبات' }, blacklist: { fr: 'Liste noire', ar: 'القائمة' }, revenue: { fr: 'Revenus', ar: 'الإيرادات' }, map: { fr: 'Carte', ar: 'الخريطة' } };
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}><Button size="sm" icon="plus">{lang==='ar'?'إضافة عضو':'Ajouter un membre'}</Button></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {staff.map((s, i) => (
          <div key={i} style={{ background: T.paper, borderRadius: 14, padding: 16, boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 999, background: T.primary, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 15, flexShrink: 0 }}>{s.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="dz-h3" style={{ fontSize: 15 }}>{s.name}</span>
                {s.owner && <span style={{ fontSize: 10, fontWeight: 700, color: T.primaryDeep, background: T.primarySoft, padding: '2px 7px', borderRadius: 999 }}>{lang==='ar'?'مالك':'OWNER'}</span>}
              </div>
              <div className="dz-sm" style={{ color: T.ink3, marginTop: 2 }}>{s.role[lang]}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
                {s.perms.map(p => <span key={p} style={{ fontSize: 11, fontWeight: 500, color: T.ink2, background: T.sand, padding: '4px 9px', borderRadius: 999 }}>{PERMS[p][lang]}</span>)}
              </div>
            </div>
            <Icon name="chevron" size={18} stroke={T.ink4} className="dz-flip" />
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { FleetMap, RevenueScreen, StaffScreen });
