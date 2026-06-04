import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BatchItem, ConvertOptions, OutputFormat } from '../types';
import { suggestedFilename } from '../utils/imageUtils';
import { canvasToBlob, renderToCanvas, type RenderOptions } from '../utils/canvasUtils';
import { loadImageFile } from '../utils/heicDecoder';
import { encodeAvif } from '../utils/avifEncoder';
import { compressToTarget } from './useTargetSize';
import { useAppStore } from '../store/useAppStore';
import { track, formatLabel } from '../analytics';

/** Opciones de lote: como ConvertOptions pero el resize es por escala (%) común. */
export interface BatchConvertOptions extends Omit<ConvertOptions, 'width' | 'height'> {
  scalePercent?: number;
}

interface ItemStatus {
  status: BatchItem['status'];
  result?: BatchItem['result'];
  error?: string;
}

/**
 * Conversión por lotes (Función 6) sobre la cola compartida del store.
 * Procesa en serie (no en paralelo) para no saturar memoria en móvil, mantiene el
 * estado de cada ítem y empaqueta los resultados en un ZIP. Revoca las Object URLs.
 */
export function useBatchConverter() {
  const queue = useAppStore((s) => s.queue);
  const addToQueue = useAppStore((s) => s.addToQueue);
  const removeFromQueue = useAppStore((s) => s.removeFromQueue);
  const clearQueue = useAppStore((s) => s.clearQueue);

  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const resultUrls = useRef<Set<string>>(new Set());
  const trackUrl = (url: string) => resultUrls.current.add(url);
  const revokeUrl = (url?: string) => {
    if (url && resultUrls.current.has(url)) {
      URL.revokeObjectURL(url);
      resultUrls.current.delete(url);
    }
  };

  const items: BatchItem[] = useMemo(
    () =>
      queue.map((q) => ({
        id: q.id,
        file: q.file,
        status: statuses[q.id]?.status ?? 'pending',
        result: statuses[q.id]?.result,
        error: statuses[q.id]?.error,
      })),
    [queue, statuses],
  );

  const doneCount = items.filter((i) => i.status === 'done').length;

  const addFiles = useCallback((files: File[]) => addToQueue(files), [addToQueue]);

  const removeItem = useCallback(
    (id: string) => {
      setStatuses((prev) => {
        revokeUrl(prev[id]?.result?.url);
        const next = { ...prev };
        delete next[id];
        return next;
      });
      removeFromQueue(id);
    },
    [removeFromQueue],
  );

  const clear = useCallback(() => {
    resultUrls.current.forEach((url) => URL.revokeObjectURL(url));
    resultUrls.current.clear();
    setStatuses({});
    clearQueue();
  }, [clearQueue]);

  const convertAll = useCallback(
    async (
      targetFormat: OutputFormat,
      quality: number,
      options: BatchConvertOptions = {},
    ): Promise<void> => {
      setIsProcessing(true);
      const supportsTarget = targetFormat === 'image/jpeg' || targetFormat === 'image/webp';
      const isLossy = supportsTarget || targetFormat === 'image/avif';
      const snapshot = queue.slice();

      try {
        for (const q of snapshot) {
          setStatuses((prev) => ({ ...prev, [q.id]: { status: 'converting' } }));
          try {
            const img = await loadImageFile(q.file);
            const scale = options.scalePercent ?? 100;
            const useScale = scale > 0 && scale < 100;
            const render: RenderOptions = {
              width: useScale ? Math.max(1, Math.round((img.naturalWidth * scale) / 100)) : undefined,
              height: useScale ? Math.max(1, Math.round((img.naturalHeight * scale) / 100)) : undefined,
              rotation: options.rotation,
              flipH: options.flipH,
              flipV: options.flipV,
              fillBackground: targetFormat === 'image/jpeg' ? '#ffffff' : undefined,
            };

            let blob: Blob | null;
            let qualityUsed: number | undefined;
            if (options.targetBytes && supportsTarget) {
              const found = await compressToTarget(img, targetFormat, options.targetBytes, render);
              blob = found?.blob ?? null;
              qualityUsed = found ? Math.round(found.quality * 100) : undefined;
            } else {
              const canvas = renderToCanvas(img, render);
              if (!canvas) blob = null;
              else if (targetFormat === 'image/avif') blob = await encodeAvif(canvas, quality);
              else blob = await canvasToBlob(canvas, targetFormat, quality / 100);
              qualityUsed = isLossy ? quality : undefined;
            }

            if (!blob) {
              setStatuses((prev) => ({
                ...prev,
                [q.id]: { status: 'error', error: 'Formato no soportado por el navegador.' },
              }));
              continue;
            }

            const url = URL.createObjectURL(blob);
            trackUrl(url);
            setStatuses((prev) => ({
              ...prev,
              [q.id]: {
                status: 'done',
                result: {
                  url,
                  blob,
                  filename: suggestedFilename(q.file.name, targetFormat),
                  sizeBytes: blob.size,
                  mimeType: targetFormat,
                  qualityUsed,
                },
              },
            }));
          } catch {
            setStatuses((prev) => ({ ...prev, [q.id]: { status: 'error', error: 'Error al convertir.' } }));
          }
        }
        // Métrica de uso: formato y tamaño del lote (sin contenido ni nombres).
        track('batch_convert', { format: formatLabel(targetFormat), count: snapshot.length });
      } finally {
        setIsProcessing(false);
      }
    },
    [queue],
  );

  const downloadZip = useCallback(async () => {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const used = new Map<string, number>();

    items.forEach((item) => {
      if (!item.result) return;
      let name = item.result.filename;
      const count = used.get(name) ?? 0;
      if (count > 0) {
        const dot = name.lastIndexOf('.');
        name = dot > 0 ? `${name.slice(0, dot)}_${count}${name.slice(dot)}` : `${name}_${count}`;
      }
      used.set(item.result.filename, count + 1);
      zip.file(name, item.result.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roluck-convertidas.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [items]);

  // Limpieza al desmontar: revocar todas las Object URLs vivas.
  useEffect(() => {
    const urls = resultUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  return {
    items,
    isProcessing,
    doneCount,
    addFiles,
    removeItem,
    clear,
    convertAll,
    downloadZip,
  };
}
