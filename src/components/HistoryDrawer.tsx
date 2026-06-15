import { useEffect, useState } from 'react';
import { IconX, IconDownload, IconTrash } from '@tabler/icons-react';
import { useHistoryStore } from '../store/useHistoryStore';
import { downloadBlob, formatBytes } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';
import { useModal } from '../hooks/useModal';
import FormatBadge from './FormatBadge';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Panel lateral con el historial de la sesión: cada conversión hecha aparece con su
 * miniatura, formato y tamaño, y se puede volver a descargar. Crea Object URLs desde
 * los Blobs guardados y las revoca al cerrarse/cambiar para no fugar memoria.
 */
export default function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const { t } = useI18n();
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);

  // Una Object URL por entrada, solo mientras el panel está abierto.
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open) return;
    const map: Record<string, string> = {};
    entries.forEach((e) => {
      map[e.id] = URL.createObjectURL(e.blob);
    });
    setUrls(map);
    return () => Object.values(map).forEach((u) => URL.revokeObjectURL(u));
  }, [open, entries]);

  // Escape + focus-trap + restauración de foco.
  const dialogRef = useModal<HTMLDivElement>(onClose, open);

  if (!open) return null;

  return (
    <div ref={dialogRef} className="fixed inset-0 z-50 flex justify-end bg-black/60" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <aside
        tabIndex={-1}
        className="flex h-full w-full max-w-sm flex-col border-l border-border bg-bg-surface focus:outline-none"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">{t.history.title}</h2>
            <p className="text-[11px] text-text-muted">{t.history.sessionNote}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.nav.close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text-primary"
          >
            <IconX size={18} stroke={2} />
          </button>
        </header>

        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted">{t.history.empty}</p>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto p-3">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-bg-elevated p-2"
                >
                  <div className="checkerboard h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                    {urls[e.id] && <img src={urls[e.id]} alt="" className="h-full w-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">{e.filename}</p>
                    <p className="mt-0.5 flex items-center gap-2">
                      <FormatBadge mime={e.mimeType} />
                      <span className="font-mono text-xs text-text-muted">{formatBytes(e.sizeBytes)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadBlob(e.blob, e.filename)}
                    aria-label={`${t.common.download} ${e.filename}`}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-surface hover:text-accent"
                  >
                    <IconDownload size={18} stroke={2} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={clear}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:border-error/40 hover:text-error"
              >
                <IconTrash size={16} stroke={2} />
                {t.history.clear}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
