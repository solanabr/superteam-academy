import posthog from "posthog-js";

type EventProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, props?: EventProps): void {
  if (typeof window === "undefined") {
    return;
  }

  if (window.gtag) {
    window.gtag("event", name, props ?? {});
  }

  if (posthog.__loaded) {
    posthog.capture(name, props ?? {});
  }
}
