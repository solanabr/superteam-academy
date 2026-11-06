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
  if (typeof value !== "object" || value === null) return value;
  if (depth >= MAX_DEPTH) return "[truncated]";
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

interface PostHogStore {
  props: Record<string, unknown>;
  register: (properties: Record<string, unknown>) => unknown;
  set_initial_person_info?: () => void;
}

export interface PostHogPersistedState {
  persistence?: PostHogStore;
  sessionPersistence?: PostHogStore;
  get_session_id?: () => unknown;
  resetPersonPropertiesForFlags?: () => void;
}

/**
 * Cleans what the SDK keeps in the browser. Stored state outlives a deploy and
 * doesn't pass through `before_send` when the SDK reads it back.
 *
 * Initial person info and session props are written on first use, then never
 * overwritten. Forcing those writes here means the values cleaned below are the
 * ones that stay, even if the first capture comes while the URL still has params.
 */
export function scrubPersistedPostHogState(ph: PostHogPersistedState): void {
  ph.resetPersonPropertiesForFlags?.();
  ph.persistence?.set_initial_person_info?.();
  ph.get_session_id?.();
  for (const store of [ph.persistence, ph.sessionPersistence]) {
    if (store) store.register(scrubRecord(store.props));
  }
}
