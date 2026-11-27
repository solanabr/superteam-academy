/**
 * The lab RPC: the endpoint a learner's in-lesson deploy goes through. It is
 * always a devnet endpoint, and separate from the app's own RPC so the lab
 * keeps running on devnet whatever chain the Academy program is on.
 *
 * Plain `.mjs` so `next.config.mjs` builds its CSP from the same code as
 * `lib/csp.ts`.
 */

/** Used when `NEXT_PUBLIC_LAB_RPC_URL` or `LAB_RPC_URL` is unset or blank. */
export const DEFAULT_LAB_RPC_URL = "https://api.devnet.solana.com";

/**
 * A configured lab RPC URL, trimmed, or the default when there is none.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function labRpcUrlOrDefault(value) {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? DEFAULT_LAB_RPC_URL : trimmed;
}

/**
 * The `connect-src` sources for a lab RPC URL: its origin and the WebSocket
 * twin web3.js opens for confirmations. Empty for a value that is not an
 * http(s) URL or that has a wildcard host, so a bad value can only narrow the
 * policy.
 *
 * @param {string | null | undefined} value
 * @returns {string[]}
 */
export function labRpcCspSources(value) {
  /** @type {URL} */
  let url;
  try {
    url = new URL(labRpcUrlOrDefault(value));
  } catch {
    return [];
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return [];
  if (url.host.includes("*")) return [];
  return [url.origin, url.origin.replace(/^http/, "ws")];
}
