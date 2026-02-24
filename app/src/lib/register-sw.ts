/**
 * Registers the service worker for PWA offline support.
 * Call this once from the root layout or a top-level client component.
 *
 * Only registers in production to avoid interfering with HMR during development.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  });
}
