/**
 * Shared string scrubbing for telemetry (Sentry, PostHog). Pure and free of SDK
 * imports so it runs in every runtime.
 *
 * Query strings and fragments are dropped, since that's where this app's URLs
 * carry tokens and API keys. Third-party URLs shrink to their origin because
 * debugging needs to know which service was called, not the rest of the URL.
 */

export interface UrlScrubOptions {
  /** Query params worth keeping. Everything else is dropped. */
  keepParam?: (name: string) => boolean;
}

const URL_PARTS =
  /^([a-z][a-z0-9+.-]*):\/\/(?:[^/?#@]*@)?([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i;
const WEB_SCHEMES = new Set(["http", "https", "ws", "wss"]);
/** Bundler and runtime schemes in stack-like text; their paths aren't secret. */
const LOCAL_SCHEMES = new Set(["app", "file", "webpack", "webpack-internal"]);

const ABSOLUTE_URL = /\b[a-z][a-z0-9+.-]*:\/\/[^\s"'`<>\\]+/gi;
const RELATIVE_URL_WITH_QUERY =
  /(^|[\s"'`(=:,])(\/[^\s"'`?#<>]*[?#][^\s"'`<>]*)/g;

const REDACTED = "[redacted]";
const CREDENTIALS: ReadonlyArray<[RegExp, string]> = [
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, `$1 ${REDACTED}`],
  [/\bAIza[0-9A-Za-z_-]{30,}/g, REDACTED],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, REDACTED],
  [
    /\b([\w-]*(?:api[-_]?key|token|secret|password|passwd|authorization)["']?\s*[=:]\s*["']?)[^\s"'&,;]+/gi,
    `$1${REDACTED}`,
  ],
  [/\b(key=)[^\s"'&,;]+/gi, `$1${REDACTED}`],
];

function isFirstPartyHost(host: string): boolean {
  const name = host.split(":")[0]?.toLowerCase() ?? "";
  if (name === "localhost" || name === "127.0.0.1") return true;
  if (typeof window !== "undefined" && window.location?.hostname === name) {
    return true;
  }
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return Boolean(appUrl) && new URL(appUrl as string).hostname === name;
  } catch {
    return false;
  }
}

function keptQuery(query: string, keepParam: UrlScrubOptions["keepParam"]) {
  if (!keepParam) return "";
  const kept = query
    .slice(1)
    .split("&")
    .filter((pair) => keepParam(pair.split("=")[0] ?? ""));
  return kept.length > 0 ? `?${kept.join("&")}` : "";
}

/** Drops credentials, fragment and query (bar kept params); keeps the path. */
export function stripQueryAndFragment(
  url: string,
  { keepParam }: UrlScrubOptions = {}
): string {
  const parts = URL_PARTS.exec(url);
  if (parts) {
    const [, scheme, host, path, query] = parts;
    return `${scheme}://${host}${path}${keptQuery(query ?? "", keepParam)}`;
  }
  const end = url.search(/[?#]/);
  if (end === -1) return url;
  const query = url.slice(end).split("#")[0] ?? "";
  return url.slice(0, end) + keptQuery(query, keepParam);
}

/** As {@link stripQueryAndFragment}, and reduces third-party URLs to origin. */
export function scrubUrl(url: string, options: UrlScrubOptions = {}): string {
  const parts = URL_PARTS.exec(url);
  if (!parts) return stripQueryAndFragment(url, options);
  const [, rawScheme, host] = parts;
  const scheme = rawScheme?.toLowerCase() ?? "";
  const keepPath =
    LOCAL_SCHEMES.has(scheme) ||
    (WEB_SCHEMES.has(scheme) && isFirstPartyHost(host ?? ""));
  return keepPath
    ? stripQueryAndFragment(url, options)
    : `${rawScheme}://${host}`;
}

/** Scrubs every URL and recognisable credential inside free text. */
export function scrubText(text: string, options: UrlScrubOptions = {}): string {
  let out = text
    .replace(ABSOLUTE_URL, (url) => scrubUrl(url, options))
    .replace(
      RELATIVE_URL_WITH_QUERY,
      (_match, prefix: string, url: string) =>
        prefix + stripQueryAndFragment(url, options)
    );
  for (const [pattern, replacement] of CREDENTIALS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
