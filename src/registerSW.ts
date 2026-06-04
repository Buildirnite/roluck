/**
 * Registra el service worker de la PWA. Solo en producción: en desarrollo el caché
 * del SW interfiere con el HMR de Vite y confunde al depurar. Se registra tras `load`
 * para no competir con la carga inicial de la app.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('No se pudo registrar el service worker:', err);
    });
  });
}
