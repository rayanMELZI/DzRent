/** Chip — pill filter/toggle. Active = filled primary; inactive = bordered paper. */
import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: IconName;
}

export function Chip({ children, active, icon, className = '', ...rest }: ChipProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'bg-paper text-ink-2 shadow-[inset_0_0_0_1px_#DDD7CA] hover:text-ink'
      } ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={15} stroke="currentColor" />}
      {children}
    </button>
  );
}
