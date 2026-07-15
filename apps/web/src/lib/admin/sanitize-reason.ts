/**
 * Scrub secret-bearing substrings out of a `reason`/error string before it is
 * returned to the browser (reasons are rendered verbatim and can flow into
 * client telemetry). Pure. Redacts, in order:
 *   1. any `https?://…` URL (an api-keyed RPC URL leaks the whole key),
 *   2. any leftover `?api-key=…` / `&api-key=…` query param not inside a URL,
 *   3. the known secret env identifiers `SOLANA_RPC_URL` / `PROGRAM_AUTHORITY_SECRET`.
 *
 * Shared by the recreate preflight GET route (server-side scrub before the
 * response leaves the server) and the recreate-course client flow (belt-and-
 * suspenders scrub of the execute route's error string right before render —
 * see `recreate-course-flow.tsx`). No `server-only` and no imports: this must
 * be safely importable from both a route handler and a client component.
 */
export function sanitizeReason(reason: string): string {
  return reason
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .replace(/[?&]api-key=[^\s&]*/gi, "[redacted-api-key]")
    .replace(/SOLANA_RPC_URL/g, "[redacted-env]")
    .replace(/PROGRAM_AUTHORITY_SECRET/g, "[redacted-env]");
}
