import "server-only";

import { logEvent } from "@/lib/logging";

/**
 * Server-side PostHog capture, for events no browser sees (cron settlement,
 * balance checks, a route's decision). A single `fetch` to PostHog's capture
 * endpoint with the same project key and host the browser uses; no SDK, no
 * queue, no batching, because these events are rare.
 *
 * Never throws and gives up after {@link CAPTURE_TIMEOUT_MS}. A dropped event
 * logs `ANALYTICS_SERVER_001`. Disabled when the PostHog env vars are unset
 * and under tests.
 */

/** Distinct id for events that belong to the platform rather than a learner. */
export const PLATFORM_DISTINCT_ID = "platform";

const CAPTURE_TIMEOUT_MS = 2_000;

export type ServerEventProperties = Record<
  string,
  string | number | boolean | null
>;

export interface ServerCaptureConfig {
  apiKey: string;
  host: string;
  /** The app's own host, sent as `$host` so dashboards can filter by it. */
  appHost: string | null;
}

export function serverCaptureConfig(): ServerCaptureConfig | null {
  if (process.env.NODE_ENV === "test") return null;
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!apiKey || !host) return null;
  let appHost: string | null = null;
  try {
    appHost = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
      : null;
  } catch {
    appHost = null;
  }
  return { apiKey, host, appHost };
}

/** The request body PostHog's single-event capture endpoint expects. */
export function buildCapturePayload(
  config: ServerCaptureConfig,
  event: string,
  distinctId: string,
  properties: ServerEventProperties,
  now: Date = new Date()
): Record<string, unknown> {
  return {
    api_key: config.apiKey,
    event,
    distinct_id: distinctId,
    timestamp: now.toISOString(),
    properties: {
      ...properties,
      $lib: "academy-server",
      ...(config.appHost ? { $host: config.appHost } : {}),
      // A system event must not create a "platform" person.
      ...(distinctId === PLATFORM_DISTINCT_ID
        ? { $process_person_profile: false }
        : {}),
    },
  };
}

export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties: ServerEventProperties,
  config: ServerCaptureConfig | null = serverCaptureConfig(),
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  if (!config) return;
  try {
    const res = await fetchImpl(new URL("/i/v0/e/", config.host), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildCapturePayload(config, event, distinctId, properties)
      ),
      signal: AbortSignal.timeout(CAPTURE_TIMEOUT_MS),
    });
    if (!res.ok) {
      logEvent({
        event: "ANALYTICS_SERVER_001",
        context: { event, status: res.status },
      });
    }
  } catch (err) {
    logEvent({
      event: "ANALYTICS_SERVER_001",
      context: {
        event,
        reason: err instanceof Error ? err.message : String(err),
      },
    });
  }
}
