import type { BatchItem } from '../types';
import { formatBytes, savingsPercent } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';

interface BatchListProps {
  items: BatchItem[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

/** Indicador visual del estado de un ítem del lote. */
function StatusBadge({ item }: { item: BatchItem }) {
  const { t } = useI18n();
  switch (item.status) {
    case 'pending':
      return <span className="font-mono text-xs text-text-muted">{t.batch.queued}</span>;
    case 'converting':
      return (
        <span className="flex items-center gap-1.5 font-mono text-xs text-accent">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {t.batch.converting}
        </span>
      );
    case 'done': {
      const savings = item.result
        ? savingsPercent(item.file.size, item.result.sizeBytes)
        : 0;
      return (
        <span className="flex items-center gap-2 font-mono text-xs text-success">
          {item.result && formatBytes(item.result.sizeBytes)}
          {savings > 0 && <span className="text-success">−{savings}%</span>}
        </span>
      );
    }
    case 'error':
      return (
        <span className="font-mono text-xs text-error" title={item.error}>
          {t.batch.error}
        </span>
      );
  }
}

/** Lista de imágenes en modo lote, cada una con su estado (Función 6). */
export default function BatchList({ items, onRemove, disabled }: BatchListProps) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-surface">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-primary">{item.file.name}</p>
            <p className="font-mono text-xs text-text-muted">
              {formatBytes(item.file.size)}
            </p>
          </div>

          <StatusBadge item={item} />

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={disabled}
            aria-label={`${t.common.remove} ${item.file.name}`}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-error disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
