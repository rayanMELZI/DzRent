// client-search.jsx — HomeSearch, ResultsAgencies, AgencyPage + cards.

function agencyCarObjs(agency) { return agency.cars.map(carById).filter(Boolean); }
function matchCars(agency, { category, model }) {
  return agencyCarObjs(agency).filter(c =>
    (!category || category === 'all' || c.cat === category) &&
    (!model || c.id === model));
}

// ============== HOME / SEARCH ==============
function HomeSearch() {
  const { go, draft, setDraft, t, lang } = useClient();
  const [pick, setPick] = React.useState(false);
  const catFr = CATEGORIES.find(c => c.id === draft.category);
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: T.sand }}>
      {/* hero */}
      <div style={{ background: T.primary, color: '#fff', padding: '46px 20px 26px', borderRadius: '0 0 26px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 21, letterSpacing: '-.02em' }}>DzRent</span>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center' }}>
            <Icon name="bell" size={19} stroke="#fff" />
          </div>
        </div>
        <h1 className="dz-h1" style={{ color: '#fff', margin: '20px 0 4px', fontSize: 25 }}>{t('search_greeting')}</h1>
        <p className="dz-sm" style={{ color: 'rgba(255,255,255,.82)', margin: 0 }}>{t('tagline')}</p>
      </div>

      {/* search card */}
      <div style={{ padding: 16, marginTop: -14 }}>
        <div style={{ background: T.paper, borderRadius: 18, padding: 16, boxShadow: T.shadowCard, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={t('search_wilaya')} icon="pin">
            <button onClick={() => setPick(true)} style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'start' }}>
              <span style={{ color: draft.wilaya ? T.ink : T.ink4, fontWeight: draft.wilaya ? 500 : 400 }}>
                {draft.wilaya ? <span><span className="dz-mono" style={{ color: T.ink4, fontSize: 13 }}>{draft.wilaya.code} · </span>{draft.wilaya[lang]}</span> : t('search_wilaya_ph')}
              </span>
              <Icon name="chevron" size={18} stroke={T.ink4} className="dz-flip" />
            </button>
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label={t('search_from')} icon="calendar"><div style={{ ...inputStyle, fontWeight: 500 }}>{draft.from}</div></Field>
            <Field label={t('search_to')}><div style={{ ...inputStyle, fontWeight: 500 }}>{draft.to}</div></Field>
          </div>
          <div>
            <div className="dz-label" style={{ color: T.ink3, marginBottom: 8 }}>{t('search_category')}</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <Chip active={draft.category === 'all'} onClick={() => setDraft({ category: 'all' })}>{t('search_all_cat')}</Chip>
              {CATEGORIES.map(c => <Chip key={c.id} active={draft.category === c.id} onClick={() => setDraft({ category: c.id })}>{c[lang]}</Chip>)}
            </div>
          </div>
          <Button full size="lg" icon="search" onClick={() => go('results')}>{t('search_cta')}</Button>
        </div>

        {/* trust strip */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {[{ ic: 'shield', n: '420+', l: lang==='ar'?'وكالة موثقة':'agences vérifiées' },
            { ic: 'car', n: '3 100', l: lang==='ar'?'سيارة':'voitures' }].map((s,i) => (
            <div key={i} style={{ flex: 1, background: T.paper, borderRadius: 14, padding: '13px 14px', boxShadow: `inset 0 0 0 1px ${T.line2}` }}>
              <Icon name={s.ic} size={18} stroke={T.primary} />
              <div className="dz-h3" style={{ marginTop: 7 }}>{s.n}</div>
              <div className="dz-xs" style={{ color: T.ink3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <WilayaPicker open={pick} onClose={() => setPick(false)} onPick={w => setDraft({ wilaya: w })} t={t} lang={lang} />
    </div>
  );
}

// ============== RESULTS = AGENCIES ==============
function ResultsAgencies() {
  const { go, draft, setDraft, t, lang } = useClient();
  const [modelSheet, setModelSheet] = React.useState(false);
  const [model, setModel] = React.useState(null);
  const category = draft.category;

  const list = AGENCIES
    .map(a => ({ a, cars: matchCars(a, { category, model }) }))
    .filter(x => x.cars.length > 0)
    .sort((x, y) => (y.a.verified - x.a.verified) || (y.a.rating - x.a.rating));

  const modelObj = model ? carById(model) : null;
  const title = modelObj ? `${t('res_filtered')} ${modelObj[lang]}`
    : category !== 'all' ? `${t('res_filtered')} ${CATEGORIES.find(c=>c.id===category)[lang]}`
    : t('res_title');

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <CHeader title={title} sub={`${list.length} ${t('res_count_a')} ${draft.wilaya ? draft.wilaya[lang] : ''}`} onBack={() => go('home', true)} />
      {/* filters */}
      <div style={{ flexShrink: 0, padding: '10px 14px', display: 'flex', gap: 7, overflowX: 'auto', background: T.sand, borderBottom: `1px solid ${T.line3}` }}>
        <Chip icon="car" active={!!model} onClick={() => setModelSheet(true)}>{modelObj ? modelObj[lang] : t('res_filter_model')}</Chip>
        <Chip active={category === 'all'} onClick={() => setDraft({ category: 'all' })}>{t('search_all_cat')}</Chip>
        {CATEGORIES.map(c => <Chip key={c.id} active={category === c.id} onClick={() => setDraft({ category: c.id })}>{c[lang]}</Chip>)}
      </div>
      {/* agency list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map(({ a, cars }) => <AgencyCard key={a.id} agency={a} carsCount={cars.length} onClick={() => { setDraft({ agencyId: a.id, category: model ? 'all' : category, modelFilter: model }); go('agency'); }} t={t} lang={lang} />)}
        {!list.length && <div className="dz-body" style={{ color: T.ink3, textAlign: 'center', padding: 40 }}>{t('ag_no_cars')}</div>}
        <div style={{ height: 4 }} />
      </div>
      <ModelSheet open={modelSheet} onClose={() => setModelSheet(false)} onPick={m => setModel(m)} current={model} t={t} lang={lang} />
    </div>
  );
}

function ModelSheet({ open, onClose, onPick, current, t, lang }) {
  return (
    <Sheet open={open} onClose={onClose} title={t('res_filter_model')} height="76%">
      <div style={{ padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button onClick={() => { onPick(null); onClose(); }} style={modelRow(!current)}>
          <span style={{ fontWeight: 500, fontSize: 15 }}>{t('search_all_cat')}</span>
        </button>
        {CARS.map(c => (
          <button key={c.id} onClick={() => { onPick(c.id); onClose(); }} style={modelRow(current === c.id)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Icon name="car" size={18} stroke={T.ink3} />
              <span style={{ fontWeight: 500, fontSize: 15 }}>{c[lang]}</span>
            </span>
            <span className="dz-xs" style={{ color: T.ink4, textTransform: 'capitalize' }}>{CATEGORIES.find(x=>x.id===c.cat)[lang]}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
const modelRow = (on) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px', borderRadius: 11,
  background: on ? T.primarySoft : 'transparent', textAlign: 'start',
});

// ---------- Agency card ----------
function AgencyCard({ agency, carsCount, onClick, t, lang }) {
  return (
    <button onClick={onClick} className="dz-enter" style={{
      background: T.paper, borderRadius: 16, padding: 13, textAlign: 'start', width: '100%',
      boxShadow: T.shadow, display: 'flex', gap: 13, alignItems: 'stretch',
      transition: 'box-shadow .15s, transform .12s',
    }} onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowCard} onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}>
      <Placeholder label={lang==='ar'?'واجهة':'devanture'} height={84} radius={11} style={{ width: 84, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="dz-h3" style={{ fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agency[lang]}</span>
          {agency.verified && <VerifiedBadge size={16} title={t('res_verified')} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 5 }}>
          <Stars value={agency.rating} />
          <span className="dz-xs" style={{ color: T.ink4 }}>({agency.reviews})</span>
          <span className="dz-xs" style={{ color: T.ink4 }}>· {agency.completed.toLocaleString('fr-FR')} {t('res_rentals')}</span>
        </div>
        <div className="dz-sm" style={{ color: T.ink2, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="pin" size={14} stroke={T.ink4} /> {agency.commune[lang]} · {agency.distanceKm} km
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.primarySoft, color: T.primaryDeep, padding: '4px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600 }}>
            <Icon name="car" size={13} stroke={T.primaryDeep} /> {carsCount} {t('res_cars_avail')}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.clay, fontSize: 11.5, fontWeight: 600 }}>
            <Icon name="bolt" size={13} fill={T.clay} stroke="none" /> {agency.responseTime[lang]}
          </span>
        </div>
      </div>
    </button>
  );
}

// ============== AGENCY PAGE ==============
function AgencyPage() {
  const { go, draft, setDraft, t, lang } = useClient();
  const agency = agencyById(draft.agencyId);
  const [cat, setCat] = React.useState(draft.modelFilter ? 'all' : (draft.category || 'all'));
  const cars = agencyCarObjs(agency).filter(c => cat === 'all' || c.cat === cat);
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: T.sand }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ position: 'relative' }}>
          <Placeholder label={lang==='ar'?`واجهة · ${agency.fr}`:`devanture · ${agency.fr}`} height={148} radius={0} dark />
          <button onClick={() => go('results')} style={{ position: 'absolute', top: 14, insetInlineStart: 14, width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', boxShadow: T.shadow }}>
            <Icon name="back" size={19} stroke={T.ink} className="dz-flip" />
          </button>
        </div>
        {/* agency identity */}
        <div style={{ background: T.sand, borderRadius: '20px 20px 0 0', marginTop: -18, position: 'relative', padding: '18px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="dz-h1" style={{ margin: 0, fontSize: 21 }}>{agency[lang]}</h1>
            {agency.verified && <VerifiedBadge size={20} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <Stars value={agency.rating} size={14} />
            <span className="dz-sm" style={{ color: T.ink3 }}>{agency.reviews} {t('ag_reviews')}</span>
            <span className="dz-sm" style={{ color: T.ink3, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={14} stroke={T.ink4} />{agency.commune[lang]}</span>
          </div>
          {agency.verified && <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, background: T.status.approved.bg, color: T.status.approved.ink, padding: '9px 12px', borderRadius: 11, fontSize: 12.5, fontWeight: 500 }}>
            <Icon name="shield" size={16} stroke={T.status.approved.ink} />
            {t('ag_verified_on')} {agency.verifiedOn} · {agency.completed.toLocaleString('fr-FR')} {t('res_rentals')}
          </div>}
        </div>
        {/* cars */}
        <div style={{ padding: '18px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 className="dz-h2">{t('ag_cars')}</h2>
            <span className="dz-sm" style={{ color: T.ink4 }}>{cars.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
            <Chip active={cat === 'all'} onClick={() => setCat('all')}>{t('search_all_cat')}</Chip>
            {CATEGORIES.filter(c => agencyCarObjs(agency).some(x => x.cat === c.id)).map(c =>
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c[lang]}</Chip>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cars.map(c => <CarCard key={c.id} car={c} onClick={() => { setDraft({ carId: c.id }); go('car'); }} t={t} lang={lang} />)}
            {!cars.length && <div className="dz-body" style={{ color: T.ink3, textAlign: 'center', padding: 30 }}>{t('ag_no_cars')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Car card ----------
function CarCard({ car, onClick, t, lang }) {
  return (
    <button onClick={onClick} className="dz-enter" style={{ background: T.paper, borderRadius: 16, overflow: 'hidden', textAlign: 'start', width: '100%', boxShadow: T.shadow, transition: 'box-shadow .15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowCard} onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}>
      <Placeholder label={`photo · ${car.fr}`} height={134} radius={0} />
      <div style={{ padding: 13 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div className="dz-h3" style={{ fontSize: 15.5 }}>{car[lang]}</div>
            <div className="dz-xs" style={{ color: T.ink4, marginTop: 3, textTransform: 'capitalize' }}>{CATEGORIES.find(c=>c.id===car.cat)[lang]} · {car.year}</div>
          </div>
          <StatusBadge status="approved" label={t('fleet_st_available')} size="sm" />
        </div>
        <div style={{ display: 'flex', gap: 13, marginTop: 11, color: T.ink2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}><Icon name="seat" size={15} stroke={T.ink3} />{car.seats}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}><Icon name="gauge" size={15} stroke={T.ink3} />{car.trans === 'auto' ? t('car_trans_auto') : t('car_trans_man')}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}><Icon name="fuel" size={15} stroke={T.ink3} />{car.fuel === 'diesel' ? t('car_fuel_diesel') : t('car_fuel_essence')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.line3}` }}>
          <div>
            <span className="dz-mono" style={{ fontSize: 19, fontWeight: 600, color: T.ink }}>{fmtDZD(car.price)}</span>
            <span className="dz-xs" style={{ color: T.ink4 }}> {t('common_dzd')}{t('common_per_day')}</span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: T.primary, fontWeight: 600, fontSize: 14 }}>
            {t('car_book')} <Icon name="chevron" size={16} stroke={T.primary} className="dz-flip" />
          </span>
        </div>
      </div>
    </button>
  );
}

Object.assign(window, { HomeSearch, ResultsAgencies, AgencyPage, AgencyCard, CarCard, agencyCarObjs, matchCars });
