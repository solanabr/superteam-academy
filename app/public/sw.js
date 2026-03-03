/**
 * Service Worker for Superteam Academy PWA.
 *
 * Strategies:
 * - Network-first for API calls
 * - Stale-while-revalidate for pages and assets
 * - Cache-first for static assets (images, fonts)
 * - Offline fallback page
 * - Background Sync for queued offline actions
 */

const CACHE_NAME = 'academy-v2';
const OFFLINE_URL = '/offline';

// Static assets to pre-cache
const PRECACHE_URLS = [
    '/',
    '/offline',
    '/manifest.json',
    '/icons/favicon_io/favicon-32x32.png',
    '/icons/favicon_io/apple-touch-icon.png',
];

// IndexedDB constants (must match useOfflineSync.ts)
const DB_NAME = 'academy-offline';
const STORE_NAME = 'pending-actions';
const DB_VERSION = 1;

// ── Install: pre-cache essential assets ──────────────────────────────

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// ── Fetch: network-first with offline fallback ───────────────────────

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and external requests
    if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
        return;
    }

    // Course/lesson content: stale-while-revalidate (offline access)
    if (url.pathname.startsWith('/api/courses') || url.pathname.startsWith('/api/lessons')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cached = await cache.match(request);
                const fetchPromise = fetch(request).then((response) => {
                    if (response.ok) cache.put(request, response.clone());
                    return response;
                }).catch(() => cached);

                return cached || fetchPromise;
            })
        );
        return;
    }

    // Other API calls: network-only (no caching)
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Static assets: cache-first
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ttf|eot)$/)
    ) {
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
            })
        );
        return;
    }

    // Pages: network-first with offline fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => {
                return caches.match(request).then((cached) => {
                    return cached || caches.match(OFFLINE_URL);
                });
            })
    );
});

// ── Push notifications ───────────────────────────────────────────────

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: 'Superteam Academy', body: event.data.text() };
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'Superteam Academy', {
            body: data.body || '',
            icon: '/icons/favicon_io/apple-touch-icon.png',
            badge: '/icons/favicon_io/favicon-32x32.png',
            data: { url: data.url || '/' },
            vibrate: [100, 50, 100],
        })
    );
});

// ── Notification click ───────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(self.clients.openWindow(url));
});

// ── Background Sync ─────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
    if (event.tag === 'progress-sync') {
        event.waitUntil(replayPendingActions());
    }
});

/**
 * Open IndexedDB and replay all pending offline actions.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function replayPendingActions() {
    let db;
    try {
        db = await openDB();
    } catch {
        console.error('[SW] Failed to open IndexedDB for sync');
        return;
    }

    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const actions = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    let synced = 0;
    for (const action of actions) {
        try {
            const response = await fetch(action.url, {
                method: action.method,
                headers: { 'Content-Type': 'application/json' },
                body: action.body,
            });
            if (response.ok) {
                // Remove synced action
                const deleteTx = db.transaction(STORE_NAME, 'readwrite');
                deleteTx.objectStore(STORE_NAME).delete(action.id);
                synced++;
            }
        } catch {
            // Network still failing — will retry on next sync
        }
    }

    if (synced > 0) {
        console.log(`[SW] Background sync: replayed ${synced} actions`);
    }
}
