'use client';

/** Bottom-center toast for the dashboard surface (approve/refuse feedback). */
import { useStore } from '@/lib/store';
import { colors, status as statusTokens } from '@dzrent/tokens';
import { Icon } from '@/components/Icon';

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  const bg = toast.tone === 'err' ? statusTokens.refused.ink : colors.primary;
  return (
    <div
      className="dz-pop fixed bottom-7 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-r2 px-5 py-3 text-[14px] font-medium text-white shadow-card"
      style={{ background: bg }}
      role="status"
    >
      <Icon name={toast.tone === 'err' ? 'alert' : 'check'} size={17} stroke="#fff" sw={2.4} />
      {toast.msg}
    </div>
  );
}
