import { useEffect, useState } from 'react';
import { IconArrowUp, IconArrowDown, IconX, IconPlus } from '@tabler/icons-react';
import { useAppStore } from '../store/useAppStore';
import { ACCEPT_ATTR, isAcceptedImage, formatBytes } from '../utils/imageUtils';
import { useI18n } from '../i18n/I18nContext';

interface QueuePickerProps {
  /** Texto de ayuda bajo el título. */
  hint?: string;
  /** Si es true, muestra el índice (orden) en cada miniatura — útil para GIF. */
  numbered?: boolean;
  onError?: (message: string) => void;
}

/**
 * Selector sobre la cola compartida del store: arrastrar/seleccionar imágenes,
 * reordenarlas y quitarlas. Lo reutilizan las herramientas de "Crear" que operan
 * sobre varias imágenes (GIF, spritesheet, collage), encadenando con Lote/PDF sin
 * volver a subir.
 */
export default function QueuePicker({ hint, numbered, onError }: QueuePickerProps) {
  const { t } = useI18n();
  const queue = useAppStore((s) => s.queue);
  const addToQueue = useAppStore((s) => s.addToQueue);
  const removeFromQueue = useAppStore((s) => s.removeFromQueue);
  const reorderQueue = useAppStore((s) => s.reorderQueue);
  const clearQueue = useAppStore((s) => s.clearQueue);

  // Una Object URL por ítem de la cola; se revocan al desmontar o cambiar la cola.
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const map: Record<string, string> = {};
    queue.forEach((item) => {
      map[item.id] = URL.createObjectURL(item.file);
    });
    setUrls(map);
    return () => {
      Object.values(map).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [queue]);

  function handleAdd(list: FileList | null) {
    const accepted = Array.from(list ?? []).filter(isAcceptedImage);
    if (accepted.length === 0) {
      onError?.(t.batch.rejectAll);
      return;
    }
    addToQueue(accepted);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t.common.images} ({queue.length})
        </h2>
        {queue.length > 0 && (
          <button
            type="button"
            onClick={clearQueue}
            className="text-xs font-medium text-text-muted transition-colors hover:text-error"
          >
            {t.common.clear}
          </button>
        )}
      </div>

      {hint && <p className="-mt-1 text-xs text-text-muted">{hint}</p>}

      {queue.length > 0 && (
        <ul className="flex flex-col gap-2">
          {queue.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-surface p-2"
            >
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-bg-elevated">
                {urls[item.id] && (
                  <img src={urls[item.id]} alt="" className="h-full w-full object-cover" />
                )}
                {numbered && (
                  <span className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center rounded-br-lg bg-accent font-mono text-[10px] font-bold text-black">
                    {idx + 1}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text-primary">{item.file.name}</p>
                <p className="font-mono text-xs text-text-muted">{formatBytes(item.file.size)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => reorderQueue(idx, idx - 1)}
                  disabled={idx === 0}
                  aria-label={t.common.up}
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-accent disabled:opacity-30"
                >
                  <IconArrowUp size={16} stroke={2} />
                </button>
                <button
                  type="button"
                  onClick={() => reorderQueue(idx, idx + 1)}
                  disabled={idx === queue.length - 1}
                  aria-label={t.common.down}
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-accent disabled:opacity-30"
                >
                  <IconArrowDown size={16} stroke={2} />
                </button>
                <button
                  type="button"
                  onClick={() => removeFromQueue(item.id)}
                  aria-label={t.common.remove}
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-error"
                >
                  <IconX size={16} stroke={2} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary">
        <IconPlus size={16} stroke={2} />
        {queue.length === 0 ? t.common.addImages : t.common.addMore}
        <input
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={(e) => {
            handleAdd(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
