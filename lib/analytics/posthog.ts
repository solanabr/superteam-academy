type PosthogApi = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    posthog?: PosthogApi;
  }
}

export function trackPosthogEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.posthog) {
    return;
  }

  window.posthog.capture(eventName, properties);
}
