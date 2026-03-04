import posthog from "posthog-js";

export function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined") {
    posthog.capture(name, properties);
    if (window.dataLayer) {
      window.dataLayer.push({ event: name, ...properties });
    }
  }
}
