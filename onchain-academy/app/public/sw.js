// Superteam Academy Service Worker
// Increment CACHE_VERSION to invalidate all caches on deploy
const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;

// App shell resources to pre-cache on install
const APP_SHELL = ["/", "/icon.svg", "/en/offline"];

// File extensions that should use cache-first strategy
const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
];

// Paths/patterns to never cache
const NEVER_CACHE = [
  "/api/",
  "/studio/",
  "/admin/",
  "/_next/webpack-hmr",
  "chrome-extension://",
];

function shouldNeverCache(url) {
  return NEVER_CACHE.some(
    (pattern) => url.pathname.includes(pattern) || url.href.includes(pattern),
  );
}

function isStaticAsset(url) {
  return (
    STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext)) ||
    url.pathname.startsWith("/_next/static/")
  );
}

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html")
  );
}

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// Activate: delete old versioned caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: route requests to the appropriate caching strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle http/https, skip everything else
  if (!url.protocol.startsWith("http")) return;

  // Skip requests that should never be cached
  if (shouldNeverCache(url)) return;

  // Only handle GET requests
  if (event.request.method !== "GET") return;

  if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
  } else if (isNavigationRequest(event.request)) {
    // Network-first for HTML pages
    event.respondWith(networkFirst(event.request, PAGES_CACHE));
  }
});

// Cache-first: return cached version if available, otherwise fetch and cache
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // If both cache and network fail, return a basic offline response
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Network-first: try network, fall back to cache for offline support
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Last resort: serve the offline page
    const offlinePage = await caches.match("/en/offline");
    if (offlinePage) return offlinePage;

    // Absolute fallback if offline page is not cached
    const fallback = await caches.match("/");
    if (fallback) return fallback;

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/html" },
    });
  }
}
