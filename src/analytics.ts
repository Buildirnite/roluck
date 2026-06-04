/**
 * Analítica de uso con Umami auto-hospedado.
 *
 * PRIVACIDAD (regla dura): solo se envían nombres de evento y metadatos pequeños y
 * no sensibles — formato de salida, ruta, conteos, booleanos. NUNCA se envía el
 * contenido de las imágenes, los bytes, los nombres de archivo, ni dimensiones
 * concretas. Las imágenes se procesan 100% en el dispositivo y jamás se transmiten.
 *
 * Se carga solo en producción y solo si las variables de entorno de Umami están
 * configuradas, así dev/build sin red siguen funcionando. Respeta Do-Not-Track.
 */

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number | boolean>) => void;
    };
  }
}

const SRC = import.meta.env.VITE_UMAMI_SRC as string | undefined;
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;

let initialized = false;

/** Inyecta el script de Umami una sola vez (no-op si falta config o en dev). */
export function initAnalytics(): void {
  if (initialized) return;
  if (!import.meta.env.PROD) return;
  if (!SRC || !WEBSITE_ID) return;
  initialized = true;

  const s = document.createElement('script');
  s.async = true;
  s.defer = true;
  s.src = SRC;
  s.setAttribute('data-website-id', WEBSITE_ID);
  // Respeta la preferencia Do-Not-Track del navegador.
  s.setAttribute('data-do-not-track', 'true');
  document.head.appendChild(s);
}

/**
 * Registra un evento de uso. Silencioso si Umami no está cargado. Nunca debe
 * lanzar: la analítica jamás puede romper la app.
 */
export function track(
  event: string,
  data?: Record<string, string | number | boolean>,
): void {
  try {
    window.umami?.track(event, data);
  } catch {
    /* ignorado a propósito */
  }
}

/** Etiqueta corta y segura de un MIME de salida (sin datos sensibles). */
export function formatLabel(mime: string): string {
  return mime.replace(/^image\//, '').replace('jpeg', 'jpg');
}
