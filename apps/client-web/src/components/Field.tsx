/** Field — labelled form control wrapper with an optional hint. */
import { Icon, type IconName } from './Icon';

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  icon?: IconName;
}

export function Field({ label, children, hint, icon }: FieldProps) {
  return (
    <label className="block">
      <div className="dz-label mb-1.5 flex items-center gap-1.5 text-ink-3">
        {icon && <Icon name={icon} size={13} stroke="#8A8F88" />}
        {label}
      </div>
      {children}
      {hint && <div className="dz-xs mt-1.5 text-ink-4">{hint}</div>}
    </label>
  );
}

/** Shared input class for forms — matches the prototype's `inputStyle`. */
export const inputClass =
  'w-full rounded-r2 bg-sand px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-ink-4 focus:shadow-[inset_0_0_0_1.5px_#0F5249]';
