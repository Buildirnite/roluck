/**
 * Service worker de RoLuck Convertidor (PWA, escrito a mano — sin Workbox).
 *
 * Usa caché en tiempo de ejecución para no depender de los nombres con hash que
 * genera Vite: los assets se cachean a medida que la app los pide. Estrategias:
 *  - Navegación (HTML): network-first con fallback al index cacheado → funciona offline.
 *  - Assets propios con hash (/assets/...) y fuentes (/fonts/...): cache-first.
 *  - Cross-origin (CDN de OCR, etc.): stale-while-revalidate (respuestas opacas).
 *
 * El procesamiento de imágenes es 100% client-side, así que con el app shell y los
 * chunks cacheados la app funciona sin conexión (excepto OCR, que descarga sus datos
 * de idioma desde un CDN).
 */
const VERSION = 'v3';
const SHELL_CACHE = `roluck-shell-${VERSION}`;
const ASSET_CACHE = `roluck-assets-${VERSION}`;

// Recursos de nombre estable que conviene precachear en la instalación.
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/pwa-192.png',
  '/pwa-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navegación → network-first, fallback al index para rutas SPA offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  // Assets propios → cache-first (los archivos con hash son inmutables).
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok && res.type === 'basic') {
              const copy = res.clone();
              caches.open(ASSET_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Cross-origin (fuentes, etc.) → stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(ASSET_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
