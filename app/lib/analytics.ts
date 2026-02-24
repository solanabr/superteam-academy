type EventProperties = Record<string, string | number | boolean>;

export function trackEvent(name: string, properties?: EventProperties) {
  if (typeof window === "undefined") return;

  // GA4
  window.gtag?.("event", name, properties);

  // PostHog
  window.posthog?.capture(name, properties);
}
