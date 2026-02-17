import * as gtag from "./gtag";
import * as posthogClient from "./posthog";

type EventParams = Record<string, string | number | boolean>;

export const analytics = {
  trackPageView(url: string): void {
    gtag.pageview(url);
    posthogClient.capture("$pageview", { url });
  },

  trackEvent(name: string, params: EventParams = {}): void {
    gtag.event(name, params);
    posthogClient.capture(name, params);
  },

  identify(userId: string, props: EventParams = {}): void {
    posthogClient.identify(userId, props);
  },

  reset(): void {
    posthogClient.reset();
  },
} as const;
