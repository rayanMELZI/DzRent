/**
 * Button — ported variants/sizes from the design prototype's `Button`.
 * Directional `iconRight` glyphs flip in RTL via `.dz-flip`.
 */
import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'clay' | 'outline' | 'ghost' | 'soft' | 'dark' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-deep',
  clay: 'bg-clay text-white',
  outline: 'bg-transparent text-primary shadow-[inset_0_0_0_1.5px_#0F5249]',
  ghost: 'bg-transparent text-ink-2 hover:bg-sand',
  soft: 'bg-primary-soft text-primary-deep',
  dark: 'bg-ink text-white',
  danger: 'bg-status-refused-bg text-status-refused-ink shadow-[inset_0_0_0_1px_#C0392B33]',
  success: 'bg-status-approved-bg text-status-approved-ink shadow-[inset_0_0_0_1px_#2F8F5B44]',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-[38px] gap-1.5 px-3.5 py-2 text-[13px]',
  md: 'min-h-[48px] gap-2.5 px-[18px] py-3 text-[15px]',
  lg: 'min-h-[54px] gap-2.5 px-[22px] py-[15px] text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  icon?: IconName;
  iconRight?: IconName;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  full,
  icon,
  iconRight,
  className = '',
  ...rest
}: ButtonProps) {
  const iconSize = size === 'sm' ? 16 : 19;
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-r2 font-semibold transition-[transform,filter] duration-100 active:scale-[.975] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={iconSize} stroke="currentColor" />}
      {children}
      {iconRight && (
        <Icon name={iconRight} size={iconSize} stroke="currentColor" className="dz-flip" />
      )}
    </button>
  );
}
