/**
 * The verified-agency badge: a ✓ in a primary-green circle. Granted only after
 * RC/NIF verification — it is the agency's trust currency, not decoration
 * (design handoff §6.7).
 */
import { Icon } from './Icon';

export function VerifiedBadge({ size = 16, title = 'Vérifiée' }: { size?: number; title?: string }) {
  return (
    <span
      className="inline-grid place-items-center rounded-full bg-primary text-white"
      style={{ width: size, height: size }}
      title={title}
      aria-label={title}
    >
      <Icon name="check" size={Math.round(size * 0.66)} stroke="#fff" sw={2.6} />
    </span>
  );
}
