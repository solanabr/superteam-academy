/**
 * PostHog Analytics for Heatmaps and Session Recordings
 * 
 * PostHog provides:
 * - Heatmaps (where users click, scroll, hover)
 * - Session recordings (watch user sessions)
 * - Feature flags
 * - Event autocapture
 * 
 * Get your API key from: https://posthog.com/
 */

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

/**
 * Initialize PostHog
 */
export function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) {
    // Analytics not configured - that's ok for demo/submission
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Enable autocapture of events
    autocapture: true,
    // Capture page views
    capture_pageview: true,
    // Disable in development (optional)
    loaded: () => {
      if (process.env.NODE_ENV === "development") {
        // Still load but you can add debug config here
        console.log("PostHog loaded in development mode");
      }
    },
    // Privacy settings
    persistence: "localStorage",
    // Respect Do Not Track
    respect_dnt: true,
    // Session recording
    disable_session_recording: false,
  });
}

/**
 * Identify user (call after login)
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;

  posthog.identify(userId, traits);
}

/**
 * Reset user (call on logout)
 */
export function resetUser(): void {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;

  posthog.reset();
}

/**
 * Track custom events
 */
export function captureEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;

  posthog.capture(eventName, properties);
}

/**
 * Opt-out of tracking
 */
export function optOut(): void {
  if (typeof window === "undefined") return;
  posthog.opt_out_capturing();
}

/**
 * Opt-in to tracking
 */
export function optIn(): void {
  if (typeof window === "undefined") return;
  posthog.opt_in_capturing();
}

export { posthog };
