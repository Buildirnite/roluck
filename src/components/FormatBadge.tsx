import { formatLabel } from '../utils/imageUtils';

interface FormatBadgeProps {
  /** MIME type a mostrar, ej: "image/png". */
  mime: string;
  /** Variante visual: neutra (origen) o acentuada (destino). */
  variant?: 'neutral' | 'accent';
}

/** Badge visual compacto para mostrar un formato de imagen. */
export default function FormatBadge({ mime, variant = 'neutral' }: FormatBadgeProps) {
  const styles =
    variant === 'accent'
      ? 'bg-accent/15 text-accent border-accent/40'
      : 'bg-bg-elevated text-text-muted border-border';

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-medium tracking-wide ${styles}`}
    >
      {formatLabel(mime)}
    </span>
  );
}
