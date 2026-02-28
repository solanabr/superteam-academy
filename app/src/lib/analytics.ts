/**
 * Custom analytics event tracking for GA4 + PostHog.
 * Events are sent via gtag when GA_MEASUREMENT_ID is configured,
 * and via PostHog when POSTHOG_KEY is configured.
 *
 * PostHog is loaded lazily via dynamic import to keep it off the
 * critical rendering path (~100KB savings on initial bundle).
 */

/**
 * Discriminated union of all tracked analytics events.
 * Each event has a unique `name` and typed `params` payload.
 * Add new events here to ensure type-safe tracking across the app.
 */
type AnalyticsEvent =
  | { name: "course_enrolled"; params: { course_slug: string; course_title: string } }
  | { name: "lesson_completed"; params: { course_slug: string; lesson_id: string; xp_earned: number } }
  | { name: "achievement_claimed"; params: { achievement_id: number; achievement_name: string } }
  | { name: "language_changed"; params: { locale: string } }
  | { name: "wallet_connected"; params: { wallet_type: string } }
  | { name: "certificate_shared"; params: { platform: "twitter" | "linkedin"; cert_id: string } }
  | { name: "code_challenge_run"; params: { course_slug: string; lesson_id: string; passed: boolean } };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Dispatch an analytics event to all configured providers (GA4 + PostHog).
 * Safe to call during SSR (no-ops when `window` is undefined).
 * Silently ignores providers that are not initialized.
 * PostHog is imported dynamically so its ~100KB bundle is never on the critical path.
 * @param event - Typed analytics event with name and params
 */
export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;

  // GA4
  if (window.gtag) {
    window.gtag("event", event.name, event.params);
  }

  // PostHog — dynamic import keeps posthog-js off the critical bundle.
  // If PostHogProvider already loaded it, this resolves instantly from cache.
  import("posthog-js")
    .then(({ default: posthog }) => {
      if (posthog.__loaded) {
        posthog.capture(event.name, event.params);
      }
    })
    .catch(() => {
      // PostHog not available — silently ignore
    });
}
