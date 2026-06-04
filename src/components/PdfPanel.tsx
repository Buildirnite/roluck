import { useState } from 'react';
import type { BatchItem, PdfOptions, PdfOrientation, PdfPageSize } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface PdfPanelProps {
  items: BatchItem[];
  options: PdfOptions;
  onOptionsChange: (next: PdfOptions) => void;
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  isGenerating: boolean;
}

const ORIENTATIONS: { value: PdfOrientation; key: 'auto' | 'vertical' | 'horizontal' }[] = [
  { value: 'auto', key: 'auto' },
  { value: 'portrait', key: 'vertical' },
  { value: 'landscape', key: 'horizontal' },
];

const PAGE_SIZES: { value: PdfPageSize; key: 'a4' | 'letter' }[] = [
  { value: 'a4', key: 'a4' },
  { value: 'letter', key: 'letter' },
];

/** Panel de opciones de PDF + lista reordenable de páginas (Función 7). */
export default function PdfPanel({
  items,
  options,
  onOptionsChange,
  onReorder,
  onRemove,
  isGenerating,
}: PdfPanelProps) {
  const { t } = useI18n();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-bg-surface p-4">
      {/* Opciones */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-text-muted">
            {t.pdfPanel.orientation}
          </span>
          <select
            value={options.orientation}
            onChange={(e) =>
              onOptionsChange({ ...options, orientation: e.target.value as PdfOrientation })
            }
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          >
            {ORIENTATIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t.pdfPanel[o.key]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-text-muted">
            {t.pdfPanel.pageSize}
          </span>
          <select
            value={options.pageSize}
            onChange={(e) =>
              onOptionsChange({ ...options, pageSize: e.target.value as PdfPageSize })
            }
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          >
            {PAGE_SIZES.map((p) => (
              <option key={p.value} value={p.value}>
                {t.pdfPanel[p.key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-text-muted">
          {t.pdfPanel.filename}
        </span>
        <div className="flex items-center rounded-lg border border-border bg-bg-elevated focus-within:border-accent">
          <input
            type="text"
            value={options.filename}
            onChange={(e) => onOptionsChange({ ...options, filename: e.target.value })}
            placeholder="roluck-imagenes"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary outline-none"
          />
          <span className="px-3 font-mono text-xs text-text-muted">.pdf</span>
        </div>
      </label>

      {/* Lista reordenable de páginas */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
          {t.pdfPanel.pagesHint(items.length)}
        </p>
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable={!isGenerating}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) onReorder(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex items-center gap-2 rounded-lg border bg-bg-elevated px-3 py-2 ${
                dragIndex === index ? 'border-accent opacity-60' : 'border-border'
              }`}
            >
              <span className="cursor-grab text-text-muted" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
                </svg>
              </span>
              <span className="font-mono text-xs text-text-muted">{index + 1}.</span>
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                {item.file.name}
              </span>

              <button
                type="button"
                onClick={() => onReorder(index, index - 1)}
                disabled={index === 0 || isGenerating}
                aria-label={t.common.up}
                className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:text-accent disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 15 6-6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onReorder(index, index + 1)}
                disabled={index === items.length - 1 || isGenerating}
                aria-label={t.common.down}
                className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:text-accent disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                disabled={isGenerating}
                aria-label={`${t.common.remove} ${item.file.name}`}
                className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:text-error disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
