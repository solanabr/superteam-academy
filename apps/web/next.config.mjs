import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

/**
 * Static Content-Security-Policy FALLBACK for routes the middleware does not
 * run on — namely `/studio/*` (Sanity Studio) and `/api/*`. The user-facing app
 * gets a stricter, per-request nonce CSP built in `middleware.ts` + `lib/csp.ts`
 * (no `'unsafe-inline'` for scripts); middleware response headers override these
 * static ones where both apply, so the nonce policy wins for matched routes.
 *
 * Studio KEEPS `'unsafe-inline'` + `'unsafe-eval'` for scripts: it is a
 * third-party SPA bundle that cannot be nonced and relies on eval. `/api/*`
 * returns JSON/binary (no inline scripts), so the script policy is moot there.
 * Keep the non-script directives here in rough sync with `lib/csp.ts`.
 *
 * Notable allowances:
 * - `'unsafe-eval'` in script-src — REQUIRED for Studio (and Monaco, on the
 *   middleware path). - Server-only externals (Gemini, Rust Playground, build
 *   server) are NOT listed: the browser only talks to same-origin `/api/*`.
 */
const cspDirectives = [
  "default-src 'self'",

  // Scripts (Studio/API fallback): 'unsafe-inline' is REQUIRED for the Sanity
  // Studio bundle, which cannot be nonced. The user-facing app does NOT use
  // this — its middleware CSP replaces 'unsafe-inline' with a per-request nonce.
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://www.googletagmanager.com https://*.posthog.com",

  // Styles: 'unsafe-inline' required by Next.js (and Sanity Studio) inline CSS.
  // fonts.googleapis.com allows the Google Fonts stylesheet (DM Sans) link.
  "style-src 'self' 'unsafe-inline' https://cdn.sanity.io https://fonts.googleapis.com",

  // Fonts: self-hosted via next/font + Google Fonts (gstatic serves the files).
  "font-src 'self' data: https://fonts.gstatic.com",

  // Images: avatars (Google), NFT art (Arweave), Supabase storage, Sanity CDN +
  // Studio media library, GA4 measurement pixel (doubleclick). data:/blob:
  // cover inline SVGs, canvas-confetti, and wallet QR codes. Supabase stays a
  // wildcard here (Studio/API fallback); the app's middleware CSP pins it.
  "img-src 'self' data: blob: https://cdn.sanity.io https://media.sanity.io https://lh3.googleusercontent.com https://arweave.net https://*.arweave.net https://*.supabase.co https://stats.g.doubleclick.net",

  // Network: Supabase (REST + realtime wss), Sanity (CDN/API + listen wss),
  // Solana/Helius RPC, Google OAuth/identity, and analytics (GA4, PostHog,
  // Sentry). Wildcards here because this fallback is build-time and serves
  // Studio (admin-only); the app's middleware CSP pins Supabase + the Solana
  // RPC to concrete hosts at request time. Sanity/PostHog/Sentry stay wildcards
  // in both — regional/multi-subdomain ingest hosts, pinning risks breakage.
  [
    "connect-src 'self'",
    "https://*.supabase.co wss://*.supabase.co",
    "https://api.sanity.io https://cdn.sanity.io https://*.apicdn.sanity.io https://*.api.sanity.io wss://*.api.sanity.io https://media.sanity.io",
    "https://*.helius-rpc.com https://api.devnet.solana.com https://api.mainnet-beta.solana.com",
    // web3.js opens a wss:// to the RPC for subscriptions (deploy confirmation).
    "wss://*.helius-rpc.com wss://api.devnet.solana.com wss://api.mainnet-beta.solana.com",
    "https://accounts.google.com https://*.googleapis.com",
    "https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://stats.g.doubleclick.net",
    "https://*.posthog.com https://*.sentry.io https://*.ingest.sentry.io",
  ].join(" "),

  // Frames: Sanity Studio is a same-origin embed; Google OAuth may use frames;
  // lesson videos embed the YouTube and Vimeo players. Keep in sync with the
  // per-request CSP in src/lib/csp.ts.
  "frame-src 'self' https://accounts.google.com https://www.youtube.com https://player.vimeo.com",

  // Workers: code sandbox + Monaco spawn workers from blob: URLs; Monaco also
  // loads its language workers (ts/json/css/html) directly from the jsdelivr CDN.
  "worker-src 'self' blob: https://cdn.jsdelivr.net",

  // Forms may post to self and the Google OAuth endpoint.
  "form-action 'self' https://accounts.google.com",

  // Hardening directives.
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
];

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Studio is a same-origin embed, so SAMEORIGIN (not DENY).
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

// Static CSP header, applied ONLY to routes the middleware skips (`/studio/*`,
// `/api/*`). Matched app routes get the per-request nonce CSP from middleware,
// which overrides this where both apply.
const staticCspHeader = {
  key: "Content-Security-Policy",
  value: cspDirectives.join("; "),
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable the instrumentation hook so src/instrumentation.ts runs at startup
  // (validates env vars). Stable in Next 15; opt-in in Next 14.
  experimental: {
    instrumentationHook: true,
    // The server-side challenge executor (lib/challenge/executor.ts) runs learner
    // code in QuickJS-on-WASM. Keep these packages EXTERNAL so webpack does not
    // re-bundle the single-file variant — its WASM is embedded via octal escapes
    // in a template literal, which Node's module loader rejects once webpack has
    // re-emitted it. Left external, Node loads the package's own (valid) file and
    // Next's output file tracing still includes it (the WASM travels inside the
    // JS, so there is no separate .wasm artifact to trace).
    serverComponentsExternalPackages: [
      "quickjs-emscripten-core",
      "@jitl/quickjs-singlefile-cjs-release-sync",
    ],
  },
  transpilePackages: ["@superteam-lms/types", "@superteam-lms/sanity"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        // Global hardening headers (HSTS, X-Frame-Options, etc.). No CSP here —
        // the app's CSP comes from middleware; Studio/API CSP is added below.
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Sanity Studio is excluded from middleware, so apply the static CSP
        // fallback (keeps 'unsafe-inline'/'unsafe-eval' for the Studio bundle).
        source: "/studio/:path*",
        headers: [staticCspHeader],
      },
      {
        // API routes are excluded from middleware too. They serve JSON/binary,
        // so the script policy is moot, but keep a CSP for defense-in-depth.
        source: "/api/:path*",
        headers: [staticCspHeader],
      },
    ];
  },
};

/**
 * Sentry build-time options.
 *
 * `withSentryConfig` only augments build/upload behaviour (source-map upload +
 * the client/server/edge instrumentation injection) — it returns the wrapped
 * config otherwise untouched, so the `headers()`/CSP block above is preserved
 * verbatim. Source-map upload is gated on `SENTRY_AUTH_TOKEN`, so local/CI
 * builds without it still succeed.
 *
 * Client→Sentry ingest goes directly to the DSN host. The CSP `connect-src`
 * above already allows `https://*.sentry.io` + `https://*.ingest.sentry.io`,
 * which covers standard `*.ingest.sentry.io` (and region `*.ingest.<region>`
 * is a subdomain of `sentry.io`). A self-hosted/custom ingest host would need
 * its own `connect-src` entry — do not assume the default.
 */
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Silence the build-time logger unless CI explicitly opts in.
  silent: !process.env.CI,
  // Tree-shake the Sentry SDK's internal debug/logger statements out of
  // production bundles (depends on the bundler's tree-shaking being enabled).
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
};

export default withSentryConfig(withNextIntl(nextConfig), sentryBuildOptions);
