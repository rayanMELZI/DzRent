'use client';

/**
 * Dashboard topbar: search, language toggle (FR/العربية), notification center,
 * live session identity. In RTL, flex order follows document direction.
 */
import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useMarkAllRead, useNotifications } from '@/lib/notifications';
import { relativeFromNow } from '@/lib/dates';
import { Icon } from '@/components/Icon';
import type { Lang } from '@dzrent/i18n';

export function Topbar() {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();
  const notifications = useNotifications();
  const markAllRead = useMarkAllRead();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.phone : 'DzRent';
  const initials =
    user && (user.firstName || user.lastName)
      ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  const unread = notifications.data?.unread ?? 0;
  const items = notifications.data?.items ?? [];

  // Opening the center marks everything read (badge clears).
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markAllRead.mutate();
  };

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const langs: { id: Lang; label: string }[] = [
    { id: 'fr', label: 'FR' },
    { id: 'ar', label: 'العربية' },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line-2 bg-paper px-6">
      <label className="flex h-10 max-w-md flex-1 items-center gap-2.5 rounded-r2 bg-sand px-3.5 text-ink-3">
        <Icon name="search" size={18} stroke="currentColor" />
        <input
          className="dz-sm w-full bg-transparent text-ink outline-none placeholder:text-ink-4"
          placeholder={t('dash_search')}
        />
      </label>

      <div className="ms-auto flex items-center gap-3">
        <div className="flex gap-0.5 rounded-r2 bg-sand p-0.5">
          {langs.map((l) => {
            const on = lang === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  on ? 'bg-primary text-white' : 'text-ink-3 hover:text-ink'
                }`}
                style={{ fontFamily: l.id === 'ar' ? 'var(--font-arabic)' : undefined }}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        {/* Notification center */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={toggle}
            aria-expanded={open}
            className="relative grid h-10 w-10 place-items-center rounded-r2 text-ink-2 hover:bg-sand"
          >
            <Icon name="bell" size={20} stroke="currentColor" />
            {unread > 0 && (
              <span className="dz-tnum absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="dz-pop absolute end-0 top-12 z-[200] w-[360px] overflow-hidden rounded-r3 bg-paper shadow-card">
              <div className="dz-h3 border-b border-line-2 px-4 py-3 text-ink">{t('notif_title')}</div>
              <div className="max-h-[380px] overflow-y-auto">
                {items.length === 0 && (
                  <div className="dz-sm px-4 py-8 text-center text-ink-4">{t('notif_empty')}</div>
                )}
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`border-b border-line-3 px-4 py-3 last:border-b-0 ${
                      n.readAt ? '' : 'bg-primary-soft/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-clay" />}
                      <div className="min-w-0 flex-1">
                        <div className="dz-sm text-ink" style={{ overflowWrap: 'anywhere' }}>
                          {n.payload?.body ?? n.templateId}
                        </div>
                        <div className="dz-xs mt-1 text-ink-4">{relativeFromNow(n.createdAt, lang)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary">
            {initials}
          </div>
          <div className="leading-tight">
            <div className="dz-sm font-semibold text-ink">{displayName}</div>
            <div className="dz-xs text-ink-4">{t('surface_agency')}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
