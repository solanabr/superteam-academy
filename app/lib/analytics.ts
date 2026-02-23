type EventProperties = Record<string, string | number | boolean>;

export function trackEvent(name: string, properties?: EventProperties) {
  // GA4
  if (typeof window !== "undefined" && "gtag" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag("event", name, properties);
  }

  // PostHog
  if (typeof window !== "undefined" && "posthog" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).posthog?.capture(name, properties);
  }
}
