import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { isAcceptedImage } from '../utils/imageUtils';

/** Rutas que trabajan sobre la cola compartida (la imagen pegada se añade a ella). */
const QUEUE_ROUTES = ['/lote', '/pdf', '/crear'];
/** Rutas que trabajan sobre la imagen activa (la imagen pegada la reemplaza). */
const SINGLE_ROUTES = ['/convertir', '/comprimir', '/editor', '/redimensionar'];

/**
 * Atajo global: pegar (Ctrl/Cmd+V) una imagen del portapapeles la carga directamente.
 * Según la ruta activa va a la cola (Lote/PDF/Crear) o a la imagen activa (resto, con
 * salto a /convertir si la ruta actual no muestra la imagen activa). `onPasted` recibe
 * `'queued'` o `'single'` para el aviso visual.
 */
export function useClipboardPaste(onPasted: (kind: 'single' | 'queued') => void): void {
  const navigate = useNavigate();
  const location = useLocation();
  const setActiveFile = useAppStore((s) => s.setActiveFile);
  const addToQueue = useAppStore((s) => s.addToQueue);

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      // Buscar el primer ítem que sea una imagen.
      let file: File | null = null;
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          file = item.getAsFile();
          break;
        }
      }
      if (!file || !isAcceptedImage(file)) return;

      e.preventDefault();
      if (QUEUE_ROUTES.some((r) => location.pathname.startsWith(r))) {
        addToQueue([file]);
        onPasted('queued');
      } else {
        setActiveFile(file);
        // Si la ruta actual no muestra la imagen activa (ej. /herramientas o raíz),
        // llevar al usuario a Convertir para que vea lo que pegó.
        if (!SINGLE_ROUTES.some((r) => location.pathname.startsWith(r))) navigate('/convertir');
        onPasted('single');
      }
    };

    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [location.pathname, navigate, setActiveFile, addToQueue, onPasted]);
}
