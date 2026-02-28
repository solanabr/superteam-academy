/// Service Worker — Superteam Academy PWA
/// Vanilla service worker with multi-strategy caching

const CACHE_VERSION = 'sta-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_URL = '/offline.html';

/**
 * App shell resources cached eagerly on install.
 * Keep this list lean — only critical assets that enable
 * the skeleton UI to render while the network catches up.
 */
const APP_SHELL = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon.svg',
];

// ─── Install ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate — purge stale caches ─────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch strategies ───────────────────────────────────

/**
 * Network-first: try network, fall back to cache.
 * Used for API calls where freshness matters.
 */
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request));
}

/**
 * Cache-first: serve from cache, fetch & update in background.
 * Used for static assets that rarely change (_next/static, images, fonts).
 */
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;

    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}

/**
 * Stale-while-revalidate: serve cached immediately,
 * update cache in background for next visit.
 * Used for page navigations.
 */
function staleWhileRevalidate(request) {
  return caches.open(DYNAMIC_CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
}

// ─── Route matching ─────────────────────────────────────

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|eot)$/i.test(url.pathname)
  );
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// ─── Main fetch handler ─────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests — mutations should always hit the network
  if (request.method !== 'GET') return;

  // API calls — network-first for freshness
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets — cache-first for speed
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Page navigations — stale-while-revalidate with offline fallback
  if (isNavigationRequest(request)) {
    event.respondWith(
      staleWhileRevalidate(request).then(
        (response) => response || caches.match(OFFLINE_URL)
      )
    );
    return;
  }

  // Everything else — network with cache fallback
  event.respondWith(networkFirst(request));
});
