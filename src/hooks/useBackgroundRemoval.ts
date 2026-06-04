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
 * Corre un modelo de ML en el navegador. El paquete (y el modelo, ~5MB) se importa
 * de forma diferida: solo se descarga cuando el usuario activa la función.
 * El resultado es siempre un PNG con canal alfa (fondo transparente).
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

      const blob = await removeBackground(source, {
        output: { format: 'image/png' },
        progress: (key, current, total) => {
          if (total > 0) setProgress(current / total);
          // Las claves vienen como "fetch:<url>" o "compute:..." → texto amigable.
          setStage(
            key.startsWith('fetch') ? 'Descargando modelo…' : 'Quitando fondo…',
          );
        },
      });

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
