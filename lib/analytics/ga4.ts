declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackGa4Event(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, params ?? {});
}
