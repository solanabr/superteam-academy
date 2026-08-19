/**
 * Analytics facade — unified entry point for all analytics providers.
 *
 * Dispatches tracking calls to GA4, PostHog, and Sentry. Each provider
 * gracefully degrades when its environment variables are not configured.
 *
 * Usage:
 *   import { initAnalytics, trackEvent, trackPageView, identifyUser } from "@/lib/analytics";
 *
 *   // Call once on app mount (e.g., in a client-side layout effect)
 *   await initAnalytics();
 *
 *   // Track events
 *   trackEvent("lesson_completed", { lessonId: "intro-1", xp: 50 });
 *   trackPageView("/en/courses/intro-to-solana");
 *   identifyUser("user-uuid", { walletAddress: "7xK..." });
 *
 * The canonical event inventory (names, payload shapes, reserved names) is
 * documented in README.md next to this file; typed helpers with dedupe live
 * in events.ts.
 */

import { initGA4, trackGA4Event, trackGA4PageView } from "./ga4";
import {
  initPostHog,
  trackPostHogEvent,
  identifyPostHogUser,
  resetPostHogUser,
} from "./posthog";
import { initSentry, setSentryUser, clearSentryUser } from "./sentry";

// Re-export individual modules for granular access
export { initGA4, trackGA4Event, trackGA4PageView } from "./ga4";
export {
  initPostHog,
  trackPostHogEvent,
  identifyPostHogUser,
  resetPostHogUser,
} from "./posthog";
export {
  initSentry,
  captureError,
  setSentryUser,
  clearSentryUser,
} from "./sentry";
export {
  EVALUATION_WINDOW_WEEKS,
  EVALUATION_WINDOW_DAYS,
  LAUNCH_DATE,
  EXPERIMENT_REGISTRY,
  earliestReadDate,
  exposureStartFor,
  registryWithEarliestRead,
  isReadable,
  type ExperimentRegistryEntry,
  type ExperimentRow,
  type ExperimentStatus,
} from "./experiment-registry";

/**
 * Initialize all analytics providers.
 * Call this once when the application mounts on the client side.
 */
export async function initAnalytics(): Promise<void> {
  initGA4();
  await Promise.all([initPostHog(), initSentry()]);
}

/**
 * Track a named event across all configured providers.
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  trackGA4Event(name, properties);
  trackPostHogEvent(name, properties);
}

/**
 * Track a page view across all configured providers.
 */
export function trackPageView(url: string): void {
  // Both providers want the full URL (GA4 page_location, PostHog
  // $current_url) — trackGA4PageView reads it at capture time too.
  trackGA4PageView(url);
  // PostHog expects a FULL URL in $current_url (host filtering, session
  // replay linking); the bare pathname GA4 wants would register as a
  // malformed URL. Read it at capture time so buffered pre-init events keep
  // the page they were fired on.
  const currentUrl = typeof window !== "undefined" ? window.location.href : url;
  trackPostHogEvent("$pageview", { $current_url: currentUrl });
}

/**
 * Identify the current user across all configured providers.
 */
export function identifyUser(
  userId: string,
  traits?: Record<string, unknown>
): void {
  identifyPostHogUser(userId, traits);
  setSentryUser(userId);
}

/**
 * Reset user identity across all configured providers. Call on sign-out so
 * subsequent events and errors are not attributed to the previous account.
 */
export function resetUser(): void {
  resetPostHogUser();
  clearSentryUser();
}
