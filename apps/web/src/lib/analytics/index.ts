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
 */

import { initGA4, trackGA4Event, trackGA4PageView } from "./ga4";
import { initPostHog, trackPostHogEvent, identifyPostHogUser } from "./posthog";
import { initSentry, setSentryUser } from "./sentry";

// Re-export individual modules for granular access
export { initGA4, trackGA4Event, trackGA4PageView } from "./ga4";
export {
  initPostHog,
  trackPostHogEvent,
  identifyPostHogUser,
  resetPostHogUser,
} from "./posthog";
export { initSentry, captureError, setSentryUser } from "./sentry";

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
  trackGA4PageView(url);
  trackPostHogEvent("$pageview", { $current_url: url });
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
