// agency.jsx — Agency dashboard: shell (sidebar+topbar), Home, Fleet.
// Requests queue, Blacklist, Map in agency2.jsx.

const AGENCY_ME = AGENCIES[0]; // Sahara Auto Location

// fleet seed for the logged-in agency
const FLEET = [
  { id: 'f1', car: 'logan',   plate: '00412-114-16', status: 'rented',    ins: 92, tech: 210 },
  { id: 'f2', car: 'accent',  plate: '01188-114-16', status: 'available', ins: 18, tech: 140 },
  { id: 'f3', car: 'tucson',  plate: '00937-114-16', status: 'rented',    ins: 240, tech: 9 },
  { id: 'f4', car: 'golf',    plate: '02051-114-16', status: 'available', ins: 130, tech: 64 },
  { id: 'f5', car: 'classec', plate: '00076-114-16', status: 'maint',     ins: 200, tech: 95 },
  { id: 'f6', car: 'sandero', plate: '01620-114-16', status: 'available', ins: 31, tech: 180 },
  { id: 'f7', car: 'logan',   plate: '02244-114-16', status: 'inspect',   ins: 150, tech: 25 },
  { id: 'f8', car: 'accent',  plate: '00509-114-16', status: 'oos',       ins: 4, tech: 50 },
];

const AgencyContext = React.createContext(null);
const useAgency = () => React.useContext(AgencyContext);

function AgencyApp() {
  const { t, lang } = useLang();
  const [screen, setScreen] = React.useState('dash');
  const store = useStore();

  const NAV = [
    { id: 'dash', icon: 'grid', key: 'dash_nav_home' },
    { id: 'fleet', icon: 'car', key: 'dash_nav_fleet' },
    { id: 'requests', icon: 'doc', key: 'dash_nav_requests', badge: store.pendingCount },
    { id: 'map', icon: 'pin', key: 'dash_nav_map' },
    { id: 'blacklist', icon: 'shield', key: 'dash_nav_blacklist' },
    { id: 'revenue', icon: 'chart', key: 'dash_nav_revenue' },
    { id: 'staff', icon: 'user', key: 'dash_nav_staff' },
  ];
  const SCREENS = { dash: DashHome, fleet: FleetScreen, requests: RequestsQueue, blacklist: Blacklist, map: FleetMap, revenue: RevenueScreen, staff: StaffScreen };
  const Screen = SCREENS[screen] || DashHome;
  const title = t(NAV.find(n => n.id === screen).key);

  return (
    <AgencyContext.Provider value={{ screen, setScreen, t, lang }}>
      <div style={{ flex: 1, display: 'flex', minHeight: 0, background: T.sand }}>
        {/* sidebar */}
        <div style={{ width: 232, flexShrink: 0, background: T.primary, color: '#fff', display: 'flex', flexDirection: 'column', padding: '18px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 18px' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', display: 'grid', placeItems: 'center', color: T.primary, fontWeight: 700, fontSize: 16 }}>D</div>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.02em' }}>DzRent</span>
            <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,.16)', padding: '2px 6px', borderRadius: 6, letterSpacing: '.04em' }}>PRO</span>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {NAV.map(n => {
              const on = screen === n.id;
              return (
                <button key={n.id} onClick={() => setScreen(n.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 10, textAlign: 'start',
                  background: on ? 'rgba(255,255,255,.16)' : 'transparent', color: '#fff', position: 'relative',
                  fontWeight: on ? 600 : 500, fontSize: 14, transition: 'background .14s',
                }} onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,.08)'; }} onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                  <Icon name={n.icon} size={19} stroke="#fff" sw={on ? 2 : 1.7} />
                  <span style={{ flex: 1 }}>{t(n.key)}</span>
                  {n.badge > 0 && <span className="dz-tnum" style={{ background: T.clay, color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 19, height: 19, borderRadius: 999, display: 'grid', placeItems: 'center', padding: '0 5px' }}>{n.badge}</span>}
                </button>
              );
            })}
          </nav>
          {/* agency identity */}
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="building" size={18} stroke="#fff" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{AGENCY_ME[lang]}</span>
                <VerifiedBadge size={13} />
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.7)' }}>{AGENCY_ME.commune[lang]}</div>
            </div>
          </div>
        </div>

        {/* main */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* topbar */}
          <div style={{ height: 62, flexShrink: 0, background: T.paper, borderBottom: `1px solid ${T.line2}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px' }}>
            <h1 className="dz-h2" style={{ margin: 0 }}>{title}</h1>
            <div style={{ flex: 1, maxWidth: 320, marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: T.sand, borderRadius: 10, padding: '9px 12px' }}>
              <Icon name="search" size={17} stroke={T.ink4} />
              <input placeholder={t('dash_search')} style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: 13.5, color: T.ink }} />
            </div>
            <button onClick={() => setScreen('requests')} style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, background: T.sand, display: 'grid', placeItems: 'center' }}>
              <Icon name="bell" size={19} stroke={T.ink2} />
              {store.pendingCount > 0 && <span style={{ position: 'absolute', top: 7, insetInlineEnd: 7, width: 8, height: 8, borderRadius: 999, background: T.clay, boxShadow: `0 0 0 2px ${T.paper}` }} />}
            </button>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: T.primary, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 14 }}>SK</div>
          </div>
          {/* screen */}
          <div key={screen} className="dz-enter" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 24 }}>
            <Screen />
          </div>
        </div>
      </div>
    </AgencyContext.Provider>
  );
}

// ============== DASHBOARD HOME ==============
function DashHome() {
  const { setScreen, t, lang } = useAgency();
  const store = useStore();
  const active = FLEET.filter(f => f.status === 'rented').length;
  const util = Math.round(active / FLEET.length * 100);
  const kpis = [
    { key: 'kpi_active', val: active, icon: 'car', tone: T.primary, sub: `/ ${FLEET.length} ${lang==='ar'?'مركبة':'véhicules'}` },
    { key: 'kpi_revenue', val: '1 842 000', unit: t('common_dzd'), icon: 'chart', tone: T.clay, trend: '+12%' },
    { key: 'kpi_util', val: util + '%', icon: 'gauge', tone: T.primary, bar: util },
    { key: 'kpi_pending', val: store.pendingCount, icon: 'doc', tone: T.status.pending.dot, action: () => setScreen('requests') },
  ];
  const alerts = FLEET.filter(f => f.ins <= 30 || f.tech <= 30).map(f => ({ f, type: f.tech <= f.ins ? 'tech' : 'ins', days: Math.min(f.ins, f.tech) })).sort((a,b)=>a.days-b.days);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1080 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {kpis.map(k => (
          <div key={k.key} onClick={k.action} style={{ background: T.paper, borderRadius: 16, padding: 18, boxShadow: T.shadow, cursor: k.action ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: k.tone + '18', display: 'grid', placeItems: 'center' }}>
                <Icon name={k.icon} size={20} stroke={k.tone} />
              </div>
              {k.trend && <span style={{ fontSize: 12, fontWeight: 600, color: T.status.approved.ink, background: T.status.approved.bg, padding: '3px 8px', borderRadius: 999 }}>{k.trend}</span>}
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="dz-mono" style={{ fontSize: 26, fontWeight: 600 }}>{k.val}</span>
              {(k.unit || k.sub) && <span className="dz-xs" style={{ color: T.ink4 }}>{k.unit || k.sub}</span>}
            </div>
            <div className="dz-sm" style={{ color: T.ink3, marginTop: 2 }}>{t(k.key)}</div>
            {k.bar != null && <div style={{ marginTop: 10, height: 5, borderRadius: 9, background: T.line2 }}><div style={{ width: k.bar + '%', height: '100%', borderRadius: 9, background: T.primary }} /></div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        {/* recent requests */}
        <div style={{ background: T.paper, borderRadius: 16, padding: 18, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 className="dz-h3">{t('dash_recent_req')}</h2>
            <button onClick={() => setScreen('requests')} style={{ color: T.primary, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>{t('dash_view_all')} <Icon name="chevron" size={15} stroke={T.primary} className="dz-flip" /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {store.requests.slice(0, 4).map(r => {
              const car = carById(r.car);
              return (
                <button key={r.id} onClick={() => setScreen('requests')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10, textAlign: 'start', transition: 'background .12s' }} onMouseEnter={e => e.currentTarget.style.background = T.sand} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 38, height: 38, borderRadius: 999, background: r.flagged ? T.status.refused.bg : T.primarySoft, color: r.flagged ? T.status.refused.ink : T.primaryDeep, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{r.customer.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.customer.name}</div>
                    <div className="dz-xs" style={{ color: T.ink4 }}>{car[lang]} · {r.createdAt}</div>
                  </div>
                  {r.flagged && <Icon name="alert" size={17} stroke={T.status.refused.ink} />}
                  <StatusBadge status={r.status === 'approved' ? 'approved' : r.status === 'refused' ? 'refused' : 'pending'} size="sm" t={t} />
                </button>
              );
            })}
          </div>
        </div>

        {/* compliance alerts */}
        <div style={{ background: T.paper, borderRadius: 16, padding: 18, boxShadow: T.shadow }}>
          <h2 className="dz-h3" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="alert" size={18} stroke={T.status.expiring.dot} />{t('dash_alerts')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(({ f, type, days }) => {
              const car = carById(f.car);
              return (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 11, background: days <= 10 ? T.status.refused.bg : T.status.pending.bg }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{car[lang]}</div>
                    <div className="dz-xs" style={{ color: T.ink3 }}>{type === 'tech' ? t('dash_alert_tech') : t('dash_alert_ins')} {days} {t('dash_days')}</div>
                  </div>
                  <span className="dz-mono" style={{ fontSize: 11.5, color: T.ink4 }}>{f.plate.split('-')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== FLEET ==============
const FLEET_STATUS = {
  available: { key: 'fleet_st_available', sb: 'approved' },
  rented:    { key: 'fleet_st_rented', sb: 'pending' },
  maint:     { key: 'fleet_st_maint', sb: 'expiring' },
  oos:       { key: 'fleet_st_oos', sb: 'refused' },
  inspect:   { key: 'fleet_st_inspect', sb: 'none' },
};
function FleetScreen() {
  const { t, lang } = useAgency();
  const [filter, setFilter] = React.useState('all');
  const [view, setView] = React.useState('grid');
  const rows = FLEET.filter(f => filter === 'all' || f.status === filter);
  return (
    <div style={{ maxWidth: 1080 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 7, flex: 1, flexWrap: 'wrap' }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>{t('fleet_all')} · {FLEET.length}</Chip>
          {Object.keys(FLEET_STATUS).map(s => (
            <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>{t(FLEET_STATUS[s].key)} · {FLEET.filter(f => f.status === s).length}</Chip>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2, background: T.paper, borderRadius: 9, padding: 3, boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
          {['grid','list'].map(v => <button key={v} onClick={() => setView(v)} style={{ width: 34, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center', background: view === v ? T.primarySoft : 'transparent' }}><Icon name={v} size={17} stroke={view === v ? T.primaryDeep : T.ink4} /></button>)}
        </div>
        <Button size="sm" icon="plus">{t('fleet_add')}</Button>
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {rows.map(f => <FleetCard key={f.id} f={f} t={t} lang={lang} />)}
        </div>
      ) : (
        <div style={{ background: T.paper, borderRadius: 14, boxShadow: T.shadow, overflow: 'hidden' }}>
          {rows.map((f, i) => <FleetRow key={f.id} f={f} t={t} lang={lang} last={i === rows.length - 1} />)}
        </div>
      )}
    </div>
  );
}

function ComplianceDot({ days, label }) {
  const tone = days <= 10 ? T.status.refused : days <= 30 ? T.status.expiring : T.status.approved;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: tone.ink, fontWeight: 500 }} title={`${label}: ${days}j`}>
      <span style={{ width: 7, height: 7, borderRadius: 9, background: tone.dot }} />{label} {days <= 30 ? `${days}j` : '✓'}
    </span>
  );
}

function FleetCard({ f, t, lang }) {
  const car = carById(f.car);
  const st = FLEET_STATUS[f.status];
  return (
    <div style={{ background: T.paper, borderRadius: 15, boxShadow: T.shadow, overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <Placeholder label={`photo · ${car.fr}`} height={120} radius={0} />
        <div style={{ position: 'absolute', top: 10, insetInlineStart: 10 }}><StatusBadge status={st.sb} label={t(st.key)} size="sm" /></div>
      </div>
      <div style={{ padding: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="dz-h3" style={{ fontSize: 14.5 }}>{car[lang]}</span>
          <span className="dz-mono" style={{ fontSize: 11.5, color: T.ink4 }}>{f.plate}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.line3}` }}>
          <ComplianceDot days={f.ins} label={lang==='ar'?'تأمين':'Assur.'} />
          <ComplianceDot days={f.tech} label={lang==='ar'?'فحص':'Visite'} />
        </div>
      </div>
    </div>
  );
}

function FleetRow({ f, t, lang, last }) {
  const car = carById(f.car);
  const st = FLEET_STATUS[f.status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: last ? 'none' : `1px solid ${T.line3}` }}>
      <Placeholder label={car.fr} height={42} radius={8} style={{ width: 64, flexShrink: 0 }} />
      <div style={{ width: 160 }}><div className="dz-h3" style={{ fontSize: 14 }}>{car[lang]}</div><div className="dz-xs" style={{ color: T.ink4, textTransform: 'capitalize' }}>{CATEGORIES.find(c=>c.id===car.cat)[lang]}</div></div>
      <span className="dz-mono" style={{ fontSize: 12, color: T.ink3, width: 120 }}>{f.plate}</span>
      <div style={{ width: 130 }}><StatusBadge status={st.sb} label={t(st.key)} size="sm" /></div>
      <div style={{ display: 'flex', gap: 14, flex: 1 }}>
        <ComplianceDot days={f.ins} label={lang==='ar'?'تأمين':'Assur.'} />
        <ComplianceDot days={f.tech} label={lang==='ar'?'فحص':'Visite'} />
      </div>
      <Icon name="chevron" size={18} stroke={T.ink4} className="dz-flip" />
    </div>
  );
}

Object.assign(window, { AGENCY_ME, FLEET, FLEET_STATUS, AgencyApp, AgencyContext, useAgency, DashHome, FleetScreen, ComplianceDot, FleetCard, FleetRow });
