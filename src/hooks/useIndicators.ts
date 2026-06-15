import { useCallback, useEffect, useRef, useState } from 'react';
import { cachedOrFallback, fetchIndicators, type Snapshot } from '../utils/indicators';

/**
 * Mantiene los indicadores (UF/UTM/dólar/euro) actualizados solos: muestra la caché al
 * instante, consulta lo último al montar, y se re-consulta automáticamente cuando los datos
 * quedan viejos (al volver a la pestaña, recuperar el foco, o cada `REFRESH_MS`).
 *
 * 30 min equilibra frescura y no saturar la API: la UF cambia una vez al día y el dólar
 * unas pocas veces. La re-consulta automática solo ocurre si pasó ese tiempo desde la
 * última descarga, así abrir/enfocar repetidamente no dispara peticiones de más.
 */
const REFRESH_MS = 30 * 60 * 1000;

export function useIndicators() {
  const [snap, setSnap] = useState<Snapshot>(() => cachedOrFallback());
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const snapRef = useRef(snap);
  snapRef.current = snap;

  const refresh = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setSnap(await fetchIndicators());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(); // al montar: siempre busca lo último

    const refreshIfStale = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - (snapRef.current.fetchedAt || 0) >= REFRESH_MS) void refresh();
    };
    const id = window.setInterval(refreshIfStale, REFRESH_MS);
    document.addEventListener('visibilitychange', refreshIfStale);
    window.addEventListener('focus', refreshIfStale);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refreshIfStale);
      window.removeEventListener('focus', refreshIfStale);
    };
  }, [refresh]);

  return { snap, loading, failed, refresh };
}
