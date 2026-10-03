/*
 * CredLink V2 service worker.
 *
 * Cache name is V2-specific so it can never collide with the old frontend's
 * worker on a shared origin. Authenticated API responses are never cached: the
 * fetch handler skips anything under /api/ and all React Server Component
 * payloads. Portal navigations are network-only with a public offline fallback.
 */
const CACHE_NAME = 'credlink-v2-pwa-v1';

const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/register',
  '/how-it-works',
  '/trust',
  '/manifest.json',
  '/favicon.ico',
  '/icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-icon.png',
  '/logo.png',
  '/fonts/onest-latin-wght-normal.woff2',
  '/fonts/newsreader-latin-wght-normal.woff2',
  '/fonts/ibm-plex-mono-latin-400-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch((error) => {
        console.warn('[CredLink SW] Partial pre-cache failure:', error);
      }),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache or intercept API traffic or RSC payloads.
  if (url.pathname.startsWith('/api/')) return;
  if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') return;

  if (request.mode === 'navigate') {
    // Portal pages are session-scoped: network only, no cache write.
    const isPrivate = url.pathname === '/portal' || url.pathname.startsWith('/portal/');
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!isPrivate && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
  }
});