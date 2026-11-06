import type { Breadcrumb, Event, Stacktrace } from "@sentry/nextjs";
import { scrubText, scrubUrl, stripQueryAndFragment } from "./telemetry-url";

/**
 * The one scrubber every Sentry init uses (server, edge, browser), so events,
 * breadcrumbs and spans carry what debugging needs and no more.
 *
 * Kept: stack frames, exception types, event and trace ids, tags, the route,
 * the method, status codes, the path of first-party URLs, the origin of
 * third-party ones. Dropped: query strings, cookies, every header off the
 * allowlist, request bodies, local variables, console output past a leading
 * `[errorId]`.
 */

const REQUEST_HEADER_ALLOWLIST = new Set([
  "content-type",
  "user-agent",
  "x-request-id",
  "x-vercel-id",
]);

const MAX_STRING_LENGTH = 1_024;
const MAX_DEPTH = 8;

/** Keys that hold a credential, whatever the surrounding object is. */
const CREDENTIAL_KEY =
  /cookie|authorization|api_?key|secret|password|passwd|token/;
/** Keys that hold a body, learner text or the URL parts debugging can't use. */
const DROPPED_KEYS = new Set([
  "body",
  "headers",
  "http.fragment",
  "http.query",
  "http.request.body",
  "http.response.body",
  "http.target",
  "messages",
  "prompt",
  "query_string",
  "reflection",
  "request_body",
  "response_body",
  "solution",
  "source_code",
  "url.fragment",
  "url.path",
  "url.query",
  "user_code",
]);
const DROPPED_KEY_PREFIXES = ["http.request.header.", "http.response.header."];
const URL_KEYS = new Set([
  "from",
  "http.url",
  "request_path",
  "to",
  "url",
  "url.full",
]);
/** An error code, as opposed to a learner's source under the same key. */
const SHORT_CODE = /^[\w.-]{1,40}$/;

function scrubString(text: string): string {
  if (text.length <= MAX_STRING_LENGTH) return scrubText(text);
  // Cut first: the cost of scanning shouldn't depend on what an event carries.
  return `${scrubText(text.slice(0, MAX_STRING_LENGTH))}[truncated]`;
}

function shouldDropKey(key: string, value: unknown): boolean {
  if (DROPPED_KEYS.has(key)) return true;
  if (DROPPED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return true;
  }
  if (typeof value !== "string") {
    return CREDENTIAL_KEY.test(key) && typeof value === "object";
  }
  if (key === "code") return !SHORT_CODE.test(value);
  return CREDENTIAL_KEY.test(key);
}

function scrubValue(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
  depth = 0
): unknown {
  if (typeof value === "string") return scrubString(value);
  if (typeof value !== "object" || value === null) return value;
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item): unknown => scrubValue(item, seen, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/-/g, "_");
    if (shouldDropKey(normalized, item)) continue;
    out[key] =
      URL_KEYS.has(normalized) && typeof item === "string"
        ? scrubString(scrubUrl(item.slice(0, MAX_STRING_LENGTH)))
        : scrubValue(item, seen, depth + 1);
  }
  return out;
}

function scrubRequest(request: NonNullable<Event["request"]>) {
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (REQUEST_HEADER_ALLOWLIST.has(name.toLowerCase())) {
      if (typeof value === "string") headers[name] = scrubString(value);
    }
  }
  return {
    ...(request.method ? { method: request.method } : {}),
    // An incoming request, so its path is the route, on whatever host served it.
    ...(typeof request.url === "string"
      ? { url: stripQueryAndFragment(request.url) }
      : {}),
    headers,
  };
}

function scrubFrames(stacktrace: Stacktrace | undefined): void {
  if (!Array.isArray(stacktrace?.frames)) return;
  for (const frame of stacktrace.frames) {
    delete frame.vars;
    if (typeof frame.filename === "string") {
      frame.filename = stripQueryAndFragment(frame.filename);
    }
    if (typeof frame.abs_path === "string") {
      frame.abs_path = stripQueryAndFragment(frame.abs_path);
    }
  }
}

/** The `[errorId]` that `logError` leads with. All that's kept of a console line. */
const CONSOLE_LABEL = /^\[[\w.:-]{1,64}\]/;

/** `beforeBreadcrumb`. Null drops it: console arguments can hold anything. */
export function scrubSentryBreadcrumb(
  breadcrumb: Breadcrumb
): Breadcrumb | null {
  try {
    const { category, level, message, timestamp, data } = breadcrumb;
    if (category === "console") {
      const label =
        typeof message === "string" ? CONSOLE_LABEL.exec(message)?.[0] : null;
      if (!label) return null;
      return {
        category,
        message: label,
        ...(level ? { level } : {}),
        ...(timestamp ? { timestamp } : {}),
      };
    }
    return {
      ...breadcrumb,
      ...(message === undefined
        ? {}
        : { message: scrubValue(message) as string }),
      ...(data ? { data: scrubValue(data) as Breadcrumb["data"] } : {}),
    };
  } catch {
    return null;
  }
}

/** `beforeSendSpan`, and applied to each child span of a transaction. */
export function scrubSentrySpan<
  T extends { description?: string; data?: Record<string, unknown> },
>(span: T): T {
  try {
    return {
      ...span,
      ...(span.description === undefined
        ? {}
        : { description: scrubValue(span.description) as string }),
      ...(span.data ? { data: scrubValue(span.data) as T["data"] } : {}),
    };
  } catch {
    // beforeSendSpan has to return a span, so return one with nothing in it.
    return {} as T;
  }
}

function scrubEventInPlace(event: Event): void {
  if (event.request) event.request = scrubRequest(event.request);
  if (event.user) {
    if (event.user.id !== undefined) event.user = { id: event.user.id };
    else delete event.user;
  }
  if (event.message !== undefined) {
    event.message = scrubValue(event.message) as string;
  }
  if (event.logentry) event.logentry = scrubValue(event.logentry) as never;
  if (event.transaction !== undefined) {
    event.transaction = scrubValue(event.transaction) as string;
  }
  if (event.extra) event.extra = scrubValue(event.extra) as Event["extra"];
  if (event.tags) event.tags = scrubValue(event.tags) as Event["tags"];
  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as Event["contexts"];
  }
  if (event.fingerprint !== undefined) {
    event.fingerprint = Array.isArray(event.fingerprint)
      ? (scrubValue(event.fingerprint) as string[])
      : [];
  }

  const exceptions = event.exception?.values;
  for (const exception of Array.isArray(exceptions) ? exceptions : []) {
    if (exception.type !== undefined) {
      exception.type = scrubValue(exception.type) as string;
    }
    if (exception.value !== undefined) {
      exception.value = scrubValue(exception.value) as string;
    }
    if (exception.mechanism?.data) {
      exception.mechanism.data = scrubValue(
        exception.mechanism.data
      ) as NonNullable<typeof exception.mechanism.data>;
    }
    scrubFrames(exception.stacktrace);
  }

  const threads = event.threads?.values;
  for (const thread of Array.isArray(threads) ? threads : []) {
    scrubFrames(thread.stacktrace);
  }

  // A debug image names the same file as a frame, and they're matched by value.
  const images = event.debug_meta?.images;
  for (const image of Array.isArray(images) ? images : []) {
    if ("code_file" in image && typeof image.code_file === "string") {
      image.code_file = stripQueryAndFragment(image.code_file);
    }
  }

  if (event.breadcrumbs !== undefined) {
    event.breadcrumbs = Array.isArray(event.breadcrumbs)
      ? event.breadcrumbs
          .map(scrubSentryBreadcrumb)
          .filter((crumb): crumb is Breadcrumb => crumb !== null)
      : [];
  }
  if (event.spans !== undefined) {
    event.spans = Array.isArray(event.spans)
      ? event.spans.map(scrubSentrySpan)
      : [];
  }
}

/**
 * `beforeSend`, `beforeSendTransaction` and {@link sentryScrubIntegration}.
 *
 * Never throws: the SDK answers a throw here by sending a replacement event that
 * skips `beforeSend`. If scrubbing fails, an error event goes out as its bare
 * identity and a transaction is dropped.
 */
export function scrubSentryEvent<T extends Event>(event: T): T | null {
  try {
    scrubEventInPlace(event);
    return event;
  } catch {
    if (event.type === "transaction") return null;
    const { event_id, timestamp, platform, level, environment, release } =
      event;
    return {
      event_id,
      timestamp,
      platform,
      level,
      environment,
      release,
      type: event.type,
      message: "Event not sent: telemetry scrubbing failed",
    } as T;
  }
}

/**
 * Scrubs as an event processor as well. `beforeSend` doesn't run on the event
 * the SDK sends when processing throws, and that event still picks up request
 * data. Listed last so it runs after the integrations that add data.
 */
export const sentryScrubIntegration = {
  name: "TelemetryScrub",
  processEvent: (event: Event) => scrubSentryEvent(event),
};

/** Spread into every `Sentry.init`. */
export const sentryPrivacyOptions = {
  sendDefaultPii: false,
  beforeSend: scrubSentryEvent,
  beforeSendTransaction: scrubSentryEvent,
  beforeSendSpan: scrubSentrySpan,
  beforeBreadcrumb: scrubSentryBreadcrumb,
} as const;

/**
 * For `requestDataIntegration` on the Node runtime, where it's on by default.
 * URL and headers stay on so the scrubber can apply its allowlist to them.
 */
export const sentryRequestDataOptions = {
  include: {
    cookies: false,
    data: false,
    ip: false,
    query_string: false,
  },
} as const;
