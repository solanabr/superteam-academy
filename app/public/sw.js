const CACHE_NAME = "superteam-academy-v3";
const COURSE_CACHE = "academy-courses";

const PRECACHE_URLS = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== COURSE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, chrome-extension, and API routes
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/studio")
  ) {
    return;
  }

  // Network-first for HTML (navigation)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          // Auto-update course cache if page was saved offline
          caches.open(COURSE_CACHE).then((cache) => {
            cache.match(request).then((existing) => {
              if (existing) cache.put(request, clone);
            });
          });
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          // Try course cache first, then general cache, then offline page
          caches.open(COURSE_CACHE).then((cc) =>
            cc.match(request).then((r) =>
              r || caches.match(request).then((r2) => r2 || caches.match("/offline"))
            )
          )
        )
    );
    return;
  }

  // Next.js hashed static assets — stale-while-revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Message handler: cache/uncache course pages on demand
self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_COURSE_URLS") {
    const { urls } = event.data;
    caches.open(COURSE_CACHE).then((cache) => {
      Promise.allSettled(
        urls.map((url) =>
          fetch(url).then((res) => {
            if (res.ok) cache.put(url, res);
          })
        )
      ).then(() => {
        event.source?.postMessage({ type: "COURSE_CACHED", success: true });
      });
    });
  }

  if (event.data?.type === "UNCACHE_COURSE_URLS") {
    const { urls } = event.data;
    caches.open(COURSE_CACHE).then((cache) => {
      Promise.allSettled(urls.map((url) => cache.delete(url)));
    });
  }
});
