/**
 * PostHog analytics wrapper.
 *
 * Uses posthog-js (available via pnpm). Only initializes when both
 * NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST are set.
 * All calls gracefully degrade to no-ops when env vars are missing.
 */

type PostHogInstance = {
  init: (apiKey: string, options: Record<string, unknown>) => void;
  capture: (eventName: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
};

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "";

let posthog: PostHogInstance | null = null;
let initAttempted = false;

function isConfigured(): boolean {
  return POSTHOG_KEY.length > 0 && POSTHOG_HOST.length > 0;
}

/**
 * Initialize PostHog. Safe to call multiple times; will only init once.
 * Dynamically imports posthog-js so it is not bundled when unused.
 */
export async function initPostHog(): Promise<void> {
  if (typeof window === "undefined" || !isConfigured() || initAttempted) return;

  initAttempted = true;

  try {
    // A plain dynamic import: webpack bundles posthog-js into its own chunk,
    // loaded only when analytics is configured. The previous
    // `webpackIgnore: true` variant shipped a BARE-SPECIFIER import to the
    // browser, which can never resolve — so this function silently no-opped
    // on every visit ever (caught 2026-08-17 during the analytics-account
    // migration: zero client events had ever reached PostHog). The silent
    // catch below is for genuine load failures (adblock, network), not for
    // "not installed" — posthog-js is a real dependency.
    const imported = await import("posthog-js");
    const ph = imported.default as unknown as PostHogInstance;

    ph.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // we manage page views ourselves
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });

    posthog = ph;
  } catch (err) {
    // Degrade to no-op analytics, but never silently: a swallowed failure
    // here is how a broken import shipped unnoticed for the platform's whole
    // life. One warn per load is cheap; invisible data loss is not.
    console.warn("[analytics] posthog-js failed to load:", err);
    posthog = null;
  }
}

/**
 * Track a custom event in PostHog.
 */
export function trackPostHogEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  if (!posthog) return;
  posthog.capture(name, properties);
}

/**
 * Identify a user in PostHog.
 */
export function identifyPostHogUser(
  userId: string,
  traits?: Record<string, unknown>
): void {
  if (!posthog) return;
  posthog.identify(userId, traits);
}

/**
 * Reset PostHog identity (call on logout).
 */
export function resetPostHogUser(): void {
  if (!posthog) return;
  posthog.reset();
}
