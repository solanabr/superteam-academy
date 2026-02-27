// Service Worker for CapySolBuild PWA
const STATIC_CACHE_NAME = 'CapySolBuild-static-v3';
const DYNAMIC_CACHE_NAME = 'CapySolBuild-dynamic-v3';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
];

// API routes to cache with network-first strategy
const API_CACHE_ROUTES = ['/api/courses', '/api/gamification', '/api/gamification/leaderboard'];

// Routes to always fetch from network
const NETWORK_ONLY_ROUTES = [
  '/api/auth',
  '/api/gamification/xp',
  '/api/gamification/activity',
  '/api/gamification/complete',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name.startsWith('CapySolBuild-') &&
                name !== STATIC_CACHE_NAME &&
                name !== DYNAMIC_CACHE_NAME
              );
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except CDN assets)
  if (url.origin !== self.location.origin && !url.hostname.includes('cdn')) {
    return;
  }

  // Network-only routes (auth, mutations)
  if (NETWORK_ONLY_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(fetch(request));
    return;
  }

  // API routes - Network First with fallback to cache
  if (url.pathname.startsWith('/api/')) {
    if (API_CACHE_ROUTES.some((route) => url.pathname.startsWith(route))) {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
      return;
    }

    event.respondWith(fetch(request));
    return;
  }

  // Static assets and pages - Cache First with fallback to network
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // HTML pages - Network First (avoid serving stale pages after deploy)
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
});

// Cache First strategy - for static assets
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first fetch failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Network First strategy - for API calls
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network first fallback to cache');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('CapySolBuild-'))
            .map((name) => caches.delete(name))
        );
      })
    );
  }
});

// Background sync for offline lesson completion
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-lesson-completion') {
    event.waitUntil(syncLessonCompletions());
  }
});

async function syncLessonCompletions() {
  // Get pending completions from IndexedDB
  // This would be implemented with actual IndexedDB operations
  console.log('[SW] Syncing lesson completions...');
}

// Push notifications for streaks and achievements
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {
    title: 'New notification',
    body: 'You have a new update',
    url: '/',
    actions: [],
  };

  try {
    data = { ...data, ...event.data.json() };
  } catch (_error) {
    data.body = event.data.text() || data.body;
  }

  const options = {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open new window
      return clients.openWindow(url);
    })
  );
});

console.log('[SW] Service Worker loaded');
