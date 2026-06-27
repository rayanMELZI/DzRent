'use client';

/**
 * GPS fleet map (design handoff §9.B.5) — the only dispatch/ops-styled screen.
 * Dark canvas, road lines, a dashed geofence, vehicle pins colored by state
 * (ok / speeding / out-of-geofence) with pulsing halos on violations, plus a side
 * panel of active/alert counts and per-vehicle live speed.
 */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { carById } from '@/lib/seed';
import { Icon } from '@/components/Icon';

type MapState = 'ok' | 'speed' | 'geofence';
interface MapUnit {
  id: string;
  car: string;
  plate: string;
  x: number;
  y: number;
  state: MapState;
  speed: number;
}

const MAP_UNITS: MapUnit[] = [
  { id: 'm1', car: 'tucson', plate: '00937', x: 38, y: 42, state: 'ok', speed: 48 },
  { id: 'm2', car: 'logan', plate: '00412', x: 60, y: 30, state: 'speed', speed: 132 },
  { id: 'm3', car: 'accent', plate: '01188', x: 27, y: 64, state: 'ok', speed: 0 },
  { id: 'm4', car: 'golf', plate: '02051', x: 82, y: 70, state: 'geofence', speed: 71 },
  { id: 'm5', car: 'classec', plate: '00076', x: 52, y: 58, state: 'ok', speed: 22 },
];

const STATE_COLOR: Record<MapState, string> = {
  ok: '#4EC79A',
  speed: '#E08A4A',
  geofence: '#E0675B',
};

export default function FleetMap() {
  const { lang } = useLang();
  const [sel, setSel] = useState('m2');
  const alerts = MAP_UNITS.filter((u) => u.state !== 'ok');

  const stateLabel = (s: MapState): string => {
    if (s === 'ok') return lang === 'ar' ? 'سليم' : 'Normal';
    if (s === 'speed') return lang === 'ar' ? 'تجاوز السرعة' : 'Excès de vitesse';
    return lang === 'ar' ? 'خارج المنطقة' : 'Hors geofence';
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 gap-4">
      {/* map */}
      <div
        className="relative min-w-0 flex-1 overflow-hidden rounded-r3 shadow-soft"
        style={{
          background: '#10221E',
          backgroundImage: `radial-gradient(circle at 30% 20%, #163029 0, #0E1C19 60%),
            repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 64px),
            repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px 64px)`,
        }}
      >
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <path d="M0,180 Q260,120 520,260 T1000,300" stroke="rgba(255,255,255,.07)" strokeWidth="22" fill="none" />
          <path d="M180,0 L320,640" stroke="rgba(255,255,255,.06)" strokeWidth="16" fill="none" />
          <path d="M700,0 Q760,300 640,640" stroke="rgba(255,255,255,.06)" strokeWidth="18" fill="none" />
        </svg>

        {/* geofence boundary */}
        <div
          className="absolute rounded-[26px]"
          style={{ inset: '12% 14%', border: '2px dashed rgba(78,199,154,.5)', background: 'rgba(78,199,154,.05)' }}
        >
          <span
            className="dz-label absolute start-3.5 top-2.5 text-[10px]"
            style={{ color: 'rgba(78,199,154,.8)' }}
          >
            {lang === 'ar' ? 'منطقة مرخصة' : 'Zone autorisée'}
          </span>
        </div>

        {/* pins */}
        {MAP_UNITS.map((u) => {
          const color = STATE_COLOR[u.state];
          const on = sel === u.id;
          return (
            <button
              key={u.id}
              onClick={() => setSel(u.id)}
              className="absolute"
              style={{ left: `${u.x}%`, top: `${u.y}%`, transform: 'translate(-50%,-50%)', zIndex: on ? 5 : 2 }}
            >
              {u.state !== 'ok' && (
                <span
                  className="dz-pulse absolute rounded-full"
                  style={{ inset: -8, background: color, opacity: 0.3 }}
                />
              )}
              <span
                className="relative flex items-center gap-1.5 rounded-full py-1 pe-2.5 ps-1.5"
                style={{
                  background: on ? '#fff' : 'rgba(16,28,25,.85)',
                  boxShadow: `0 2px 10px rgba(0,0,0,.4), 0 0 0 ${on ? 2 : 1.5}px ${color}`,
                }}
              >
                <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full" style={{ background: color }}>
                  <Icon name="car" size={13} stroke="#10221E" sw={2} />
                </span>
                <span className="dz-mono text-[11px] font-semibold" style={{ color: on ? '#1D2421' : '#fff' }}>
                  {u.plate}
                </span>
              </span>
            </button>
          );
        })}

        {/* legend */}
        <div
          className="absolute bottom-3.5 start-3.5 flex gap-3.5 rounded-r2 px-3.5 py-2.5"
          style={{ background: 'rgba(16,28,25,.8)', backdropFilter: 'blur(6px)' }}
        >
          {(['ok', 'speed', 'geofence'] as MapState[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'rgba(255,255,255,.85)' }}>
              <span className="h-[9px] w-[9px] rounded-full" style={{ background: STATE_COLOR[s] }} />
              {stateLabel(s)}
            </span>
          ))}
        </div>
      </div>

      {/* side panel */}
      <div className="flex w-80 shrink-0 flex-col gap-3">
        <div className="rounded-r3 bg-paper p-4 shadow-soft">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="dz-mono text-2xl font-semibold text-ink">{MAP_UNITS.length}</div>
              <div className="dz-xs text-ink-4">{lang === 'ar' ? 'مركبات نشطة' : 'véhicules actifs'}</div>
            </div>
            <div className="flex-1">
              <div className="dz-mono text-2xl font-semibold text-clay">{alerts.length}</div>
              <div className="dz-xs text-ink-4">{lang === 'ar' ? 'تنبيهات' : 'alertes'}</div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
          {MAP_UNITS.map((u) => {
            const color = STATE_COLOR[u.state];
            const car = carById(u.car);
            const on = sel === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setSel(u.id)}
                className={`rounded-r2 bg-paper p-3.5 text-start ${
                  on ? 'shadow-[inset_0_0_0_2px_#0F5249]' : 'shadow-soft'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-r1"
                    style={{ background: `${color}22` }}
                  >
                    <Icon name="car" size={18} stroke={u.state === 'ok' ? '#0F5249' : color} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-ink">{car ? car[lang] : u.car}</div>
                    <div className="dz-mono text-[11px] text-ink-4">{u.plate}-114-16</div>
                  </div>
                  <div className="text-end">
                    <div
                      className="dz-mono text-[14px] font-semibold"
                      style={{ color: u.state === 'speed' ? '#C0613A' : '#1D2421' }}
                    >
                      {u.speed}
                      <span className="text-[9px] text-ink-4"> km/h</span>
                    </div>
                  </div>
                </div>
                {u.state !== 'ok' && (
                  <div
                    className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold"
                    style={{ color: u.state === 'speed' ? '#C0613A' : '#9C352B' }}
                  >
                    <Icon name="alert" size={14} stroke={u.state === 'speed' ? '#C0613A' : '#9C352B'} />
                    {stateLabel(u.state)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
