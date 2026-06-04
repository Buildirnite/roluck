import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ConversionResult, ConvertOptions, ImageMetadata, OutputFormat } from '../types';
import { detectFormat, suggestedFilename } from '../utils/imageUtils';
import { canvasToBlob, renderToCanvas, type RenderOptions } from '../utils/canvasUtils';
import { loadImageFile } from '../utils/heicDecoder';
import { encodeAvif } from '../utils/avifEncoder';
import { compressToTarget } from './useTargetSize';
import { useAppStore } from '../store/useAppStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { track, formatLabel } from '../analytics';

/**
 * Vista de la imagen activa del store: deriva preview + metadata, mantiene el
 * resultado de la última conversión y expone las acciones de edición (que mutan
 * la pila global) y convert(). Reusa el motor de conversión existente (canvasUtils,
 * AVIF, peso objetivo); no lo reescribe.
 */
export function useActiveImage() {
  const activeStack = useAppStore((s) => s.activeStack);
  const redoStack = useAppStore((s) => s.redoStack);
  const setActiveFile = useAppStore((s) => s.setActiveFile);
  const applyEdit = useAppStore((s) => s.applyEdit);
  const undo = useAppStore((s) => s.undoEdit);
  const redo = useAppStore((s) => s.redoEdit);
  const revertToOriginal = useAppStore((s) => s.revertActive);
  const clearActive = useAppStore((s) => s.clearActive);

  const file = activeStack.length > 0 ? activeStack[activeStack.length - 1].file : null;
  const originalName = activeStack.length > 0 ? activeStack[0].file.name : null;
  const canUndo = activeStack.length > 1;
  const canRedo = redoStack.length > 0;
  const editLabels = useMemo(() => activeStack.slice(1).map((e) => e.label), [activeStack]);

  const [preview, setPreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultUrlRef = useRef<string | null>(null);
  const revokeResult = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  }, []);

  // Al cambiar la imagen de trabajo: nueva preview + metadata, resultado obsoleto.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      setMetadata(null);
      return;
    }
    revokeResult();
    setResult(null);
    setMetadata(null);

    const url = URL.createObjectURL(file);
    setPreview(url);

    let alive = true;
    loadImageFile(file)
      .then((img) => {
        if (!alive) return;
        setMetadata({
          name: file.name,
          sizeBytes: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: detectFormat(file),
        });
      })
      .catch(() => {
        if (alive) setError('No se pudo leer la imagen. ¿El archivo está dañado?');
      });

    return () => {
      alive = false;
      URL.revokeObjectURL(url);
    };
  }, [file, revokeResult]);

  const convert = useCallback(
    async (
      targetFormat: OutputFormat,
      quality: number,
      options: ConvertOptions = {},
    ): Promise<void> => {
      if (!file) {
        setError('No hay ninguna imagen cargada.');
        return;
      }
      setIsConverting(true);
      setError(null);
      try {
        const img = await loadImageFile(file);
        const render: RenderOptions = {
          width: options.width,
          height: options.height,
          rotation: options.rotation,
          flipH: options.flipH,
          flipV: options.flipV,
          fit: options.fit,
          fillBackground: targetFormat === 'image/jpeg' ? '#ffffff' : undefined,
        };

        let blob: Blob | null;
        let qualityUsed: number | undefined;
        const supportsTarget = targetFormat === 'image/jpeg' || targetFormat === 'image/webp';
        const isLossy = supportsTarget || targetFormat === 'image/avif';

        if (options.targetBytes && supportsTarget) {
          const found = await compressToTarget(img, targetFormat, options.targetBytes, render);
          blob = found?.blob ?? null;
          qualityUsed = found ? Math.round(found.quality * 100) : undefined;
        } else {
          const canvas = renderToCanvas(img, render);
          if (!canvas) {
            setError('No se pudo inicializar el canvas en este navegador.');
            return;
          }
          blob =
            targetFormat === 'image/avif'
              ? await encodeAvif(canvas, quality)
              : await canvasToBlob(canvas, targetFormat, quality / 100);
          qualityUsed = isLossy ? quality : undefined;
        }

        if (!blob) {
          setError('Tu navegador no soporta exportar a este formato. Prueba con PNG o JPEG.');
          return;
        }

        revokeResult();
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        const filename = suggestedFilename(originalName ?? file.name, targetFormat);
        setResult({ url, blob, filename, sizeBytes: blob.size, mimeType: targetFormat, qualityUsed });
        // Registrar en el historial de sesión (guarda el Blob para re-descarga).
        useHistoryStore.getState().addEntry({
          filename,
          sizeBytes: blob.size,
          mimeType: targetFormat,
          blob,
        });
        // Métrica de uso (sin datos sensibles): solo el formato de salida elegido.
        track('convert', { format: formatLabel(targetFormat) });
      } catch {
        setError('Ocurrió un error durante la conversión.');
      } finally {
        setIsConverting(false);
      }
    },
    [file, originalName, revokeResult],
  );

  const reset = useCallback(() => {
    revokeResult();
    setResult(null);
    setError(null);
    clearActive();
  }, [revokeResult, clearActive]);

  useEffect(() => () => revokeResult(), [revokeResult]);

  return {
    file,
    originalName,
    preview,
    metadata,
    result,
    isConverting,
    error,
    editLabels,
    canUndo,
    canRedo,
    setActiveFile,
    applyEdit,
    undo,
    redo,
    revertToOriginal,
    convert,
    reset,
    setError,
  };
}
