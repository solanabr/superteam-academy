/**
 * Scrub secret-bearing substrings out of a `reason`/error string before it is
 * returned to the browser (reasons are rendered verbatim and can flow into
 * client telemetry). Pure. Redacts, in order:
 *   1. any `x-access-token:<tok>@` git-credential userinfo (the codeload 302
 *      signed URL embeds the tarball PAT as `https://x-access-token:<tok>@…`),
 *   2. any `Bearer <tok>` / `token <tok>` Authorization value (ref/PR/rate-limit
 *      error bodies and thrown fetch messages can echo the request header),
 *   3. any `https?://…` URL (an api-keyed RPC URL or a tokened GitHub URL leaks
 *      the whole secret) — also covers any remaining tokened GitHub URL,
 *   4. any bare GitHub-token-shaped string (`ghp_…` / `gho_…` / `ghu_…` /
 *      `ghs_…` / `ghr_…` / `github_pat_…`) that survived rules 1–3 — a
 *      defense-in-depth net for a token that leaks without a `Bearer`/`token:`
 *      prefix or URL wrapper (e.g. echoed raw in a JSON error body),
 *   5. any leftover `?api-key=…` / `&api-key=…` query param not inside a URL,
 *   6. the known secret env identifiers `SOLANA_RPC_URL` /
 *      `PROGRAM_AUTHORITY_SECRET` / `GITHUB_PUBLISH_TOKEN` / `GITHUB_TOKEN`.
 *
 * The GitHub-credential rules (1–2) run BEFORE the URL rule so a tokened URL's
 * userinfo is scrubbed to `[redacted-token]` even if a later matcher would have
 * replaced the whole URL — belt-and-suspenders against a partial URL match.
 * The shape rule (4) runs AFTER 1–3 so it's a pure safety net: by the time it
 * runs, any token already caught by the more context-specific rules has been
 * replaced with the `[redacted-token]`/`[redacted-url]` placeholder text, which
 * doesn't match the GitHub-token shape, so rule 4 is a no-op on those and only
 * fires on a token that slipped past every earlier rule.
 *
 * Shared by the recreate preflight GET route, the recreate-course client flow,
 * and the one-click publish route (`/api/admin/publish/pin/open`, which wraps
 * every outbound GitHub error string). No `server-only` and no imports: this
 * must be safely importable from both a route handler and a client component.
 */
export function sanitizeReason(reason: string): string {
  return reason
    .replace(/x-access-token:[^@\s/]+/gi, "x-access-token:[redacted-token]")
    .replace(/\b(Bearer|token)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 [redacted-token]")
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .replace(
      /\b(gh[posru]_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+)/g,
      "[redacted-token]"
    )
    .replace(/[?&]api-key=[^\s&]*/gi, "[redacted-api-key]")
    .replace(/SOLANA_RPC_URL/g, "[redacted-env]")
    .replace(/PROGRAM_AUTHORITY_SECRET/g, "[redacted-env]")
    .replace(/GITHUB_PUBLISH_TOKEN/g, "[redacted-env]")
    .replace(/GITHUB_TOKEN/g, "[redacted-env]");
}
