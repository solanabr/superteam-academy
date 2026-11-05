import type { Breadcrumb, Event } from "@sentry/nextjs";
import { scrubText, scrubUrl, stripQueryAndFragment } from "./telemetry-url";

/**
 * The one scrubber every Sentry init uses (server, edge, browser), so events,
 * breadcrumbs and spans carry what debugging needs and no more.
 *
 * Kept: stack frames, exception types, event and trace ids, tags, the route,
 * the method, status codes, the path of first-party URLs, the origin of
 * third-party ones. Dropped: query strings, cookies, every header off the
 * allowlist, request bodies, local variables, console breadcrumbs.
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
  const scrubbed = scrubText(text);
  return scrubbed.length > MAX_STRING_LENGTH
    ? `${scrubbed.slice(0, MAX_STRING_LENGTH)}[truncated]`
    : scrubbed;
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

function scrubValue(value: unknown, seen: WeakSet<object>, depth: number) {
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
        ? scrubString(scrubUrl(item))
        : scrubValue(item, seen, depth + 1);
  }
  return out;
}

function scrubRecord<T>(record: T): T {
  return scrubValue(record, new WeakSet(), 0) as T;
}

function scrubRequest(request: NonNullable<Event["request"]>) {
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (REQUEST_HEADER_ALLOWLIST.has(name.toLowerCase())) headers[name] = value;
  }
  return {
    ...(request.method ? { method: request.method } : {}),
    // An incoming request, so its path is the route, on whatever host served it.
    ...(request.url ? { url: stripQueryAndFragment(request.url) } : {}),
    headers,
  };
}

/** `beforeBreadcrumb`. Null drops it: console arguments can hold anything. */
export function scrubSentryBreadcrumb(
  breadcrumb: Breadcrumb
): Breadcrumb | null {
  if (breadcrumb.category === "console") return null;
  return {
    ...breadcrumb,
    ...(breadcrumb.message ? { message: scrubString(breadcrumb.message) } : {}),
    ...(breadcrumb.data ? { data: scrubRecord(breadcrumb.data) } : {}),
  };
}

/** `beforeSendSpan`, and applied to each child span of a transaction. */
export function scrubSentrySpan<
  T extends { description?: string; data?: Record<string, unknown> },
>(span: T): T {
  return {
    ...span,
    ...(span.description ? { description: scrubString(span.description) } : {}),
    ...(span.data ? { data: scrubRecord(span.data) } : {}),
  };
}

/** `beforeSend` and `beforeSendTransaction`. */
export function scrubSentryEvent<T extends Event>(event: T): T {
  if (event.request) event.request = scrubRequest(event.request);
  if (event.user) {
    if (event.user.id !== undefined) event.user = { id: event.user.id };
    else delete event.user;
  }
  if (event.message) event.message = scrubString(event.message);
  if (event.logentry) event.logentry = scrubRecord(event.logentry);
  if (event.transaction) event.transaction = scrubString(event.transaction);
  if (event.extra) event.extra = scrubRecord(event.extra);
  if (event.tags) event.tags = scrubRecord(event.tags);
  if (event.contexts) event.contexts = scrubRecord(event.contexts);

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubString(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) delete frame.vars;
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map(scrubSentryBreadcrumb)
      .filter((crumb): crumb is Breadcrumb => crumb !== null);
  }
  if (event.spans) event.spans = event.spans.map(scrubSentrySpan);
  return event;
}

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
