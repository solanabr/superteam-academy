/// Service Worker for Superteam Academy PWA

const CACHE_NAME = "st-academy-v2";

// Install — skip waiting
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate — clean old caches, claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch — only cache static images/icons, everything else goes to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET, same-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Only cache images and icons — never cache HTML, JS, or CSS
  const isStaticAsset =
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/partners/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|avif|ico)$/);

  if (!isStaticAsset) return;

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
});
