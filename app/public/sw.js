const CACHE_VERSION = "v2";
const CACHE_NAME = `academy-static-${CACHE_VERSION}`;
const OFFLINE_PATHS = ["/", "/courses"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_PATHS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

const shouldBypass = (url) => {
  if (url.pathname.startsWith("/api/")) return true;
  if (url.hostname.includes("solana.com")) return true;
  if (url.hostname.includes("helius")) return true;
  return false;
};

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (shouldBypass(url) || event.request.method !== "GET") {
    return;
  }

  const isNavigationRequest =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").includes("text/html");

  // For navigations/HTML, prefer network so new deployments are seen immediately.
  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || (await caches.match("/"));
        }),
    );
    return;
  }

  // For static assets, use cache-first for performance.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("/"));
    }),
  );
});

