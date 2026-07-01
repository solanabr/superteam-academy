/**
 * Per-request Content-Security-Policy builder (used by `middleware.ts`).
 *
 * This is the ENFORCING policy for the user-facing app. It is built per request
 * so `script-src` can carry a fresh `'nonce-<value>'` instead of
 * `'unsafe-inline'` — Next.js extracts that nonce from the `Content-Security-
 * Policy` request header and stamps it onto its inline bootstrap/hydration
 * scripts (see middleware). Inline analytics are injected programmatically, not
 * as inline `<script>` tags, so they ride the host allowlist below.
 *
 * Scope: this CSP only applies to routes the middleware matches. `/studio/*`
 * (Sanity Studio) and `/api/*` are EXCLUDED from middleware, so they fall back
 * to the static CSP in `next.config.mjs` — keep the two in rough sync when
 * editing the non-script directives. Studio genuinely needs `'unsafe-inline'`/
 * `'unsafe-eval'` for scripts (third-party bundle that can't be nonced), which
 * is why it stays on the static fallback rather than this nonce policy.
 *
 * Notable script-src allowances:
 * - `'unsafe-eval'` — REQUIRED. The in-browser code-challenge sandbox
 *   (`components/editor/challenge-runner.tsx`) runs learner code via
 *   `new Function()` in a Worker, and Monaco's tokenizer/worker bootstrap also
 *   relies on it. Removing it WILL break the editor and challenge runner.
 * - NO `'strict-dynamic'` — intentionally omitted. `@monaco-editor/react`
 *   loads Monaco's AMD `loader.js` + `vs/*` chunks from jsdelivr by host, and
 *   `'strict-dynamic'` would discard the host allowlist (breaking that CDN
 *   loader). Without it, nonce'd inline scripts and host-allowlisted external
 *   scripts (Monaco CDN, GA4, PostHog) coexist — exactly what we need.
 * - `'unsafe-inline'` is DROPPED for scripts (the point of this change). It is
 *   still present for `style-src` (Next.js + Sanity inject inline CSS that
 *   can't be nonced easily — out of scope).
 */

/** Extracts the `scheme://host[:port]` origin from a URL, or null if invalid. */
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Pins `*.supabase.co` to the concrete project origin from
 * NEXT_PUBLIC_SUPABASE_URL (required, stable per deployment). Returns both the
 * https origin and its wss:// equivalent (Supabase Realtime). Falls back to the
 * `*.supabase.co` wildcard if the env var is missing/malformed so connectivity
 * is never broken by a config gap.
 */
function supabaseSources(): { http: string; ws: string } {
  const origin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!origin) {
    return { http: "https://*.supabase.co", ws: "wss://*.supabase.co" };
  }
  return { http: origin, ws: origin.replace(/^https:/, "wss:") };
}

/**
 * The browser only ever talks to NEXT_PUBLIC_SOLANA_RPC_URL, so pin
 * `connect-src` to that exact origin instead of the broad `*.helius-rpc.com`
 * wildcard. The two public Solana endpoints stay allowed as fallbacks. If the
 * env var is malformed, keep the Helius wildcard so RPC is never blocked.
 */
function solanaRpcSources(): string[] {
  const origin = originOf(process.env.NEXT_PUBLIC_SOLANA_RPC_URL);
  const base = [
    "https://api.devnet.solana.com",
    "https://api.mainnet-beta.solana.com",
  ];
  if (!origin) return ["https://*.helius-rpc.com", ...base];
  // Avoid duplicating one of the public endpoints if that's what's configured.
  return base.includes(origin) ? base : [origin, ...base];
}

/**
 * Builds the full CSP directive string for a request, embedding `nonce` into
 * `script-src`. Keep non-script directives in sync with the static fallback in
 * `next.config.mjs`.
 */
export function buildCsp(nonce: string): string {
  const supabase = supabaseSources();

  const directives = [
    "default-src 'self'",

    // Scripts: self + per-request nonce (Next.js inline bootstrap) + GA4 tag
    // loader + PostHog. 'unsafe-eval' for the code sandbox / Monaco; blob: for
    // Monaco/worker bootstrap; jsdelivr for the Monaco editor loader
    // (@monaco-editor/react fetches loader.js + vs/* from the CDN). No
    // 'unsafe-inline' (replaced by the nonce) and no 'strict-dynamic' (see
    // module docblock).
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://www.googletagmanager.com https://*.posthog.com`,

    // Styles: 'unsafe-inline' required by Next.js (and Sanity Studio) inline
    // CSS — out of scope for nonce'ing. fonts.googleapis.com allows the Google
    // Fonts stylesheet link; cdn.jsdelivr.net allows Monaco's editor.main.css —
    // the challenge-runner editor loads its stylesheet from the CDN, so without
    // this the editor renders unstyled/broken.
    "style-src 'self' 'unsafe-inline' https://cdn.sanity.io https://cdn.jsdelivr.net https://fonts.googleapis.com",

    // Fonts: self-hosted via next/font + Google Fonts (gstatic serves the files).
    "font-src 'self' data: https://fonts.gstatic.com",

    // Images: avatars (Google), NFT art (Arweave), Supabase storage (pinned to
    // the project host), Sanity CDN + Studio media library, GA4 measurement
    // pixel (doubleclick). data:/blob: cover inline SVGs, canvas-confetti, and
    // wallet QR codes.
    [
      "img-src 'self' data: blob:",
      "https://cdn.sanity.io https://media.sanity.io",
      "https://lh3.googleusercontent.com",
      "https://arweave.net https://*.arweave.net",
      supabase.http,
      "https://stats.g.doubleclick.net",
    ].join(" "),

    // Network: Supabase (REST + realtime wss, pinned to the project host),
    // Sanity (CDN/API + listen wss — wildcards kept: regional/multi-subdomain),
    // Solana RPC (pinned to the configured browser endpoint), Google
    // OAuth/identity, and analytics (GA4, PostHog, Sentry — wildcards kept:
    // region-dependent ingest subdomains).
    [
      "connect-src 'self'",
      `${supabase.http} ${supabase.ws}`,
      "https://api.sanity.io https://cdn.sanity.io https://*.apicdn.sanity.io https://*.api.sanity.io wss://*.api.sanity.io https://media.sanity.io",
      // Monaco fetches its source maps (loader.js.map, vs/*.map) from jsdelivr.
      "https://cdn.jsdelivr.net",
      ...solanaRpcSources(),
      "https://accounts.google.com https://*.googleapis.com",
      "https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://stats.g.doubleclick.net",
      "https://*.posthog.com https://*.sentry.io https://*.ingest.sentry.io",
    ].join(" "),

    // Frames: Sanity Studio is a same-origin embed; Google OAuth may use frames.
    "frame-src 'self' https://accounts.google.com",

    // Workers: code sandbox + Monaco spawn workers from blob: URLs; Monaco also
    // loads its language workers (ts/json/css/html) directly from jsdelivr.
    "worker-src 'self' blob: https://cdn.jsdelivr.net",

    // Forms may post to self and the Google OAuth endpoint.
    "form-action 'self' https://accounts.google.com",

    // Hardening directives.
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
  ];

  return directives.join("; ");
}

/** Generates a fresh base64 nonce for a request (Edge/Web Crypto safe). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // btoa is available in the Edge runtime; avoid Node Buffer for portability.
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
