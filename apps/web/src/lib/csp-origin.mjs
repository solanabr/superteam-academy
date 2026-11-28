/**
 * The one way an env URL becomes a CSP source.
 *
 * A source is written into the header as text, where a space starts another
 * source, `;` starts another directive and `,` another policy. `new URL()`
 * accepts `;`, `,`, quotes and `*` in a host and `.origin` keeps them, so the
 * origin is built here from parts that were checked, never copied from the
 * URL.
 *
 * Plain `.mjs` so `next.config.mjs` uses the same code as `lib/csp.ts`.
 */

/** A DNS name or an IPv4 literal, as the URL parser lowercases it. */
const HOST_NAME = /^[a-z0-9.-]+$/;
/** A bracketed IPv6 literal, as the URL parser serializes it. */
const IPV6_LITERAL = /^\[[0-9a-f:]+\]$/;
const PORT = /^[0-9]+$/;

/**
 * `scheme://host[:port]` for an http(s) URL, or `null`. The result holds only
 * `[a-z0-9.:[\]-]` after the scheme: no path, query, userinfo, wildcard or CSP
 * syntax. On `null` each caller keeps its own fallback.
 *
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function cspOriginOf(value) {
  if (!value) return null;
  /** @type {URL} */
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const { hostname, port } = url;
  if (!HOST_NAME.test(hostname) && !IPV6_LITERAL.test(hostname)) return null;
  if (port !== "" && !PORT.test(port)) return null;
  return `${url.protocol}//${hostname}${port === "" ? "" : `:${port}`}`;
}
