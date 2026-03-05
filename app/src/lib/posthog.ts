import posthog from "posthog-js";

/** Track a custom PostHog event. No-ops if PostHog is not initialized. */
export function trackPostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(event, properties);
  }
}

/** Identify a user in PostHog (call after wallet connection). */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.identify(userId, properties);
  }
}
