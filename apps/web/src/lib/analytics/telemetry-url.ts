/**
 * Shared string scrubbing for telemetry (Sentry, PostHog, GA4). Pure and free of
 * SDK imports so it runs in every runtime.
 *
 * Query strings and fragments are dropped, since that's where this app's URLs
 * carry tokens and API keys. Third-party URLs shrink to their origin because
 * debugging needs to know which service was called, not the rest of the URL.
 *
 * Input can be attacker-controlled (a crafted path lands in an error message or
 * a page URL), and this runs on the browser's main thread. So input is clipped
 * before scanning, URLs are found by splitting into tokens rather than by a
 * regex search, and the remaining regexes bound every run they start on.
 */

export interface UrlScrubOptions {
  /** Query params worth keeping. Everything else is dropped. */
  keepParam?: (name: string) => boolean;
}

/** Longest string scanned. Longer input is cut before any pattern runs. */
export const MAX_SCRUB_LENGTH = 8_192;
const MAX_SCHEME_LENGTH = 32;

const URL_PARTS =
  /^([a-z][a-z0-9+.-]{0,31}):\/\/(?:[^/?#@]*@)?([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i;
const WEB_SCHEMES = new Set(["http", "https", "ws", "wss"]);
/** Bundler and runtime schemes in stack-like text; their paths aren't secret. */
const LOCAL_SCHEMES = new Set(["app", "file", "webpack", "webpack-internal"]);

/** A run of URL characters. Matches can't overlap, so the split is linear. */
const TOKEN = /[^\s"'`<>\\]+/g;
const SCHEME_CHAR = /[a-z0-9+.-]/i;
const LETTER = /[a-z]/i;
/** What can sit directly before a relative path, as in `href=/en?a=b`. */
const PATH_PREFIXES = new Set(["(", "=", ":", ","]);

const REDACTED = "[redacted]";
const CREDENTIALS: ReadonlyArray<[RegExp, string]> = [
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, `$1 ${REDACTED}`],
  [/\bAIza[0-9A-Za-z_-]{30,64}/g, REDACTED],
  // Anchored on the start of a base64url run, so each run is scanned once.
  [
    /(^|[^A-Za-z0-9_-])eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    `$1${REDACTED}`,
  ],
  [
    /\b([\w-]{0,64}(?:api[-_]?key|token|secret|password|passwd|authorization)["']?\s*[=:]\s*["']?)[^\s"'&,;]+/gi,
    `$1${REDACTED}`,
  ],
  [/\b(key=)[^\s"'&,;]+/gi, `$1${REDACTED}`],
];

/** Params that authenticate or identify someone, for {@link stripAuthParams}. */
const AUTH_PARAM =
  /token|oauth|secret|password|signature|session|api[-_]?key|jwt|^(code|state|key|sig|otp|nonce|email|wallet)$/i;

function clip(text: string): string {
  return text.length > MAX_SCRUB_LENGTH
    ? text.slice(0, MAX_SCRUB_LENGTH)
    : text;
}

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
  if (!keepParam || !query) return "";
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
  const input = clip(url);
  const parts = URL_PARTS.exec(input);
  if (parts) {
    const [, scheme, host, path, query] = parts;
    return `${scheme}://${host}${path}${keptQuery(query ?? "", keepParam)}`;
  }
  const end = input.search(/[?#]/);
  if (end === -1) return input;
  const query = input.slice(end).split("#")[0] ?? "";
  return input.slice(0, end) + keptQuery(query, keepParam);
}

/** As {@link stripQueryAndFragment}, and reduces third-party URLs to origin. */
export function scrubUrl(url: string, options: UrlScrubOptions = {}): string {
  const input = clip(url);
  const parts = URL_PARTS.exec(input);
  if (!parts) return stripQueryAndFragment(input, options);
  const [, rawScheme, host] = parts;
  const scheme = rawScheme?.toLowerCase() ?? "";
  const keepPath =
    LOCAL_SCHEMES.has(scheme) ||
    (WEB_SCHEMES.has(scheme) && isFirstPartyHost(host ?? ""));
  return keepPath
    ? stripQueryAndFragment(input, options)
    : `${rawScheme}://${host}`;
}

/**
 * For a third-party that needs the URL for attribution, like GA4: removes only
 * auth and identity params and the fragment, leaving the path and other params.
 */
export function stripAuthParams(url: string): string {
  return stripQueryAndFragment(url, {
    keepParam: (name) => !AUTH_PARAM.test(name),
  });
}

function scrubRelativePath(token: string, options: UrlScrubOptions): string {
  if (!/[?#]/.test(token)) return token;
  let slash = token.indexOf("/");
  while (slash !== -1) {
    if (slash === 0 || PATH_PREFIXES.has(token.charAt(slash - 1))) {
      return (
        token.slice(0, slash) +
        stripQueryAndFragment(token.slice(slash), options)
      );
    }
    slash = token.indexOf("/", slash + 1);
  }
  return token;
}

function scrubToken(token: string, options: UrlScrubOptions): string {
  const separator = token.indexOf("://");
  if (separator > 0) {
    let start = separator;
    while (
      start > 0 &&
      separator - start < MAX_SCHEME_LENGTH &&
      SCHEME_CHAR.test(token.charAt(start - 1))
    ) {
      start--;
    }
    while (start < separator && !LETTER.test(token.charAt(start))) start++;
    if (start < separator) {
      return (
        scrubRelativePath(token.slice(0, start), options) +
        scrubUrl(token.slice(start), options)
      );
    }
  }
  return scrubRelativePath(token, options);
}

/** Scrubs every URL and recognisable credential inside free text. */
export function scrubText(text: string, options: UrlScrubOptions = {}): string {
  let out = clip(text).replace(TOKEN, (token) => scrubToken(token, options));
  for (const [pattern, replacement] of CREDENTIALS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
