import { useCallback, useState } from 'react';

interface UseBackgroundRemoval {
  isRemoving: boolean;
  progress: number; // 0–1
  stage: string | null; // texto descriptivo de la fase actual
  error: string | null;
  removeBg: (source: Blob | string) => Promise<Blob | null>;
}

/**
 * Hook para quitar el fondo de una imagen con @imgly/background-removal (Función 10).
 * Corre un modelo de ML en el navegador. El paquete y el modelo se importan de forma
 * diferida (solo al usar la función) y el modelo queda cacheado tras la primera vez.
 * Calidad: usa el modelo ISNet COMPLETO (`isnet`, mejores bordes que el `isnet_fp16`
 * por defecto) y acelera con WebGPU (`device:'gpu'`) cuando el navegador lo soporta,
 * con fallback automático a CPU. El resultado es siempre un PNG con canal alfa.
 */
export function useBackgroundRemoval(): UseBackgroundRemoval {
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const removeBg = useCallback(async (source: Blob | string): Promise<Blob | null> => {
    setIsRemoving(true);
    setProgress(0);
    setStage('Preparando…');
    setError(null);

    try {
      // Lazy import: el modelo de ML solo se descarga al usar esta función.
      const { removeBackground } = await import('@imgly/background-removal');

      // Config por dispositivo: ISNet completo + el progreso amigable. `device` cambia
      // entre WebGPU (rápido) y CPU (universal).
      const config = (device: 'cpu' | 'gpu') => ({
        model: 'isnet' as const,
        device,
        output: { format: 'image/png' as const },
        progress: (key: string, current: number, total: number) => {
          if (total > 0) setProgress(current / total);
          // Las claves vienen como "fetch:<url>" o "compute:..." → texto amigable.
          setStage(key.startsWith('fetch') ? 'Descargando modelo…' : 'Quitando fondo…');
        },
      });

      const canUseGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
      let blob: Blob;
      try {
        blob = await removeBackground(source, config(canUseGpu ? 'gpu' : 'cpu'));
      } catch (gpuError) {
        if (!canUseGpu) throw gpuError;
        // WebGPU disponible pero falló (adaptador/SO/driver): reintenta en CPU.
        setProgress(0);
        setStage('Quitando fondo…');
        blob = await removeBackground(source, config('cpu'));
      }

      setProgress(1);
      return blob;
    } catch {
      setError('No se pudo quitar el fondo. Intenta con otra imagen.');
      return null;
    } finally {
      setIsRemoving(false);
      setStage(null);
    }
  }, []);

  return { isRemoving, progress, stage, error, removeBg };
}
