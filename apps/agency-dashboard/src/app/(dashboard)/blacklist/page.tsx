'use client';

/**
 * Blacklist (design handoff §9.B.4): the shared inter-agency list. Search, a
 * "report a client" modal, and rows with a severity-colored reason pill using the
 * blacklist token — serious and distinct from "refused", not punitive clutter.
 */
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { blacklistReasonById } from '@/lib/seed';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { BlacklistModal } from './BlacklistModal';

export default function Blacklist() {
  const { t, lang } = useLang();
  const { blacklist, addBlacklist, showToast } = useStore();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);

  const ql = q.trim().toLowerCase();
  const list = blacklist.filter(
    (b) => !ql || b.name.toLowerCase().includes(ql) || b.phone.includes(ql),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-start gap-4">
        <p className="dz-sm m-0 max-w-xl flex-1 text-ink-3">{t('bl_sub')}</p>
        <Button size="sm" variant="dark" icon="plus" onClick={() => setAdding(true)}>
          {t('bl_add')}
        </Button>
      </div>

      <label className="mb-4 flex max-w-md items-center gap-2.5 rounded-r2 bg-paper px-3.5 py-2.5 shadow-[inset_0_0_0_1px_#DDD7CA]">
        <Icon name="search" size={17} stroke="#8A8F88" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('bl_search')}
          className="dz-body w-full bg-transparent text-ink outline-none placeholder:text-ink-4"
        />
      </label>

      <div className="overflow-hidden rounded-r3 bg-paper shadow-soft">
        {list.map((b, i) => {
          const reason = blacklistReasonById(b.reason);
          const high = reason?.sev === 'high';
          return (
            <div
              key={b.id}
              className={`flex items-center gap-3.5 px-[18px] py-3.5 ${
                i === list.length - 1 ? '' : 'border-b border-line-3'
              }`}
            >
              <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-status-blacklist-bg text-[14px] font-semibold text-status-blacklist-ink">
                {b.initials}
              </div>
              <div className="w-40">
                <div className="text-[14px] font-semibold text-ink">{b.name}</div>
                <div className="dz-mono text-[11.5px] text-ink-4" dir="ltr">
                  {b.phone}
                </div>
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-blacklist-bg px-3 py-1.5 text-[12.5px] font-semibold text-status-blacklist-ink">
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: high ? '#7A1F17' : '#E0A94E' }}
                  />
                  {reason ? reason[lang] : b.reason}
                </span>
                <span
                  className="ms-2 text-[11px] font-semibold"
                  style={{ color: high ? '#7A1F17' : '#9A6516' }}
                >
                  {high ? t('bl_sev_high') : t('bl_sev_mid')}
                </span>
              </div>
              <div className="dz-sm w-40 text-ink-3">
                <div>
                  {t('bl_added_by')} <span className="font-semibold text-ink-2">{b.addedBy}</span>
                </div>
                <div className="dz-xs text-ink-4">
                  {b.date} · {b.wilaya}
                </div>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div className="dz-body p-10 text-center text-ink-4">—</div>}
      </div>

      {adding && (
        <BlacklistModal
          onClose={() => setAdding(false)}
          onAdd={(entry) => {
            addBlacklist(entry);
            showToast(lang === 'ar' ? 'أُضيف للقائمة' : 'Ajouté à la liste');
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
