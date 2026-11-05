import { scrubText, scrubUrl } from "./telemetry-url";

/**
 * PostHog's `before_send`. Runs on every event including the ones the SDK makes
 * itself ($pageleave, $autocapture, $web_vitals, $$heatmap), so URLs are scrubbed
 * wherever they sit rather than in a fixed list of properties.
 */

export interface PostHogEvent {
  event: string;
  properties?: Record<string, unknown>;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Campaign and referral params aren't secret, and attribution reads them. */
const URL_OPTIONS = {
  keepParam: (name: string) => name.startsWith("utm_") || name === "ref",
};
const PERSONAL_KEY = /^(email|wallet|wallet_?address)$/i;
const MAX_DEPTH = 8;

function scrub(value: unknown, depth: number): unknown {
  if (typeof value === "string") return scrubText(value, URL_OPTIONS);
  if (typeof value !== "object" || value === null || depth >= MAX_DEPTH) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrub(item, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (PERSONAL_KEY.test(key)) continue;
    // $heatmap_data is keyed by page URL.
    const name = key.includes("://") ? scrubUrl(key, URL_OPTIONS) : key;
    out[name] = scrub(item, depth + 1);
  }
  return out;
}

function scrubRecord(record: Record<string, unknown>) {
  return scrub(record, 0) as Record<string, unknown>;
}

export function scrubPostHogEvent<T extends PostHogEvent | null>(event: T): T {
  if (!event) return event;
  return {
    ...event,
    ...(event.properties ? { properties: scrubRecord(event.properties) } : {}),
    ...(event.$set ? { $set: scrubRecord(event.$set) } : {}),
    ...(event.$set_once ? { $set_once: scrubRecord(event.$set_once) } : {}),
  };
}
