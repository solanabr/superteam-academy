/**
 * PostHog analytics wrapper.
 *
 * Uses posthog-js (available via pnpm). Only initializes when both
 * NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST are set.
 * All calls gracefully degrade to no-ops when env vars are missing.
 *
 * Init is async (dynamic import), but the first pageview and first-render
 * events fire synchronously before it resolves. Those calls land in a
 * module-level pre-init queue and are flushed in order once posthog-js loads —
 * without it, every session's first pageview was silently dropped (the
 * 53-pageleave / 14-pageview gap observed 2026-08-19).
 */

import {
  scrubPersistedPostHogState,
  scrubPostHogEvent,
  type PostHogPersistedState,
} from "./posthog-scrub";

type PostHogInstance = PostHogPersistedState & {
  init: (apiKey: string, options: Record<string, unknown>) => void;
  capture: (eventName: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string) => void;
  reset: () => void;
};

type QueuedCall =
  | { kind: "capture"; name: string; properties?: Record<string, unknown> }
  | { kind: "identify"; userId: string }
  | { kind: "reset" };

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "";

/** Bounded pre-init buffer; oldest entries are dropped past this. */
const MAX_QUEUE_LENGTH = 50;

let posthog: PostHogInstance | null = null;
let initAttempted = false;
let initFailed = false;
let warnedDropping = false;
const preInitQueue: QueuedCall[] = [];

function isConfigured(): boolean {
  return POSTHOG_KEY.length > 0 && POSTHOG_HOST.length > 0;
}

function deliver(call: QueuedCall): void {
  if (!posthog) return;
  switch (call.kind) {
    case "capture":
      posthog.capture(call.name, call.properties);
      break;
    case "identify":
      posthog.identify(call.userId);
      break;
    case "reset":
      posthog.reset();
      break;
  }
}

/**
 * Deliver immediately when initialized; buffer while init is pending; warn
 * once (then drop) when PostHog is unconfigured or its load failed.
 */
function dispatch(call: QueuedCall): void {
  if (posthog) {
    deliver(call);
    return;
  }

  if (!isConfigured() || initFailed) {
    if (!warnedDropping) {
      warnedDropping = true;
      console.warn(
        "[analytics] PostHog is not initialized — events are being dropped"
      );
    }
    return;
  }

  if (preInitQueue.length >= MAX_QUEUE_LENGTH) {
    preInitQueue.shift();
  }
  preInitQueue.push(call);
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
      before_send: scrubPostHogEvent,
      // The app reads no flags, and a /flags request carries stored person
      // properties without passing through before_send. This also stops the
      // remote config load, so project settings no longer change what the SDK
      // captures: what runs is what this object says.
      advanced_disable_flags: true,
      capture_performance: { web_vitals: true },
      // Replay stays off whatever the project settings say. The SDK checks this
      // before it honours the remote flag. The masking below only matters if
      // this line is ever removed; chat text carries `ph-no-capture`.
      disable_session_recording: true,
      session_recording: {
        maskAllInputs: true,
        blockSelector: ".monaco-editor",
      },
    });

    scrubPersistedPostHogState(ph);

    posthog = ph;
    // Flush everything captured while the import was in flight, in order.
    while (preInitQueue.length > 0) {
      deliver(preInitQueue.shift() as QueuedCall);
    }
  } catch (err) {
    // Degrade to no-op analytics, but never silently: a swallowed failure
    // here is how a broken import shipped unnoticed for the platform's whole
    // life. One warn per load is cheap; invisible data loss is not.
    console.warn("[analytics] posthog-js failed to load:", err);
    posthog = null;
    initFailed = true;
    preInitQueue.length = 0;
  }
}

/**
 * Track a custom event in PostHog. Buffered if called before init resolves.
 */
export function trackPostHogEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  dispatch({ kind: "capture", name, properties });
}

/**
 * Identify a user in PostHog by id alone. Buffered if called before init
 * resolves.
 */
export function identifyPostHogUser(userId: string): void {
  dispatch({ kind: "identify", userId });
}

/**
 * Reset PostHog identity (call on logout). Buffered if called before init
 * resolves so a fast logout still severs the previous identity.
 */
export function resetPostHogUser(): void {
  dispatch({ kind: "reset" });
}
