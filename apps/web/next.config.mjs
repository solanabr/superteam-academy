import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

/**
 * Static Content-Security-Policy FALLBACK for routes the middleware does not
 * run on — namely `/api/*`. The user-facing app gets a stricter, per-request
 * nonce CSP built in `middleware.ts` + `lib/csp.ts` (no `'unsafe-inline'` for
 * scripts); middleware response headers override these static ones where both
 * apply, so the nonce policy wins for matched routes.
 *
 * `/api/*` returns JSON/binary (no inline scripts), so the script policy is
 * moot there — this header is defense-in-depth. Keep the non-script directives
 * here in rough sync with `lib/csp.ts`.
 *
 * Notable allowances:
 * - `'unsafe-eval'` in script-src — REQUIRED for Monaco (on the middleware
 *   path). - Server-only externals (Gemini, Rust Playground, build server)
 *   are NOT listed: the browser only talks to same-origin `/api/*`.
 */
const cspDirectives = [
  "default-src 'self'",

  // Scripts (API fallback): the user-facing app does NOT use this — its
  // middleware CSP replaces 'unsafe-inline' with a per-request nonce. API
  // responses carry no inline scripts, so this is defense-in-depth only.
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://www.googletagmanager.com https://*.posthog.com",

  // Styles: 'unsafe-inline' required by Next.js inline CSS.
  // fonts.googleapis.com allows the Google Fonts stylesheet (DM Sans) link.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // Fonts: self-hosted via next/font + Google Fonts (gstatic serves the files).
  "font-src 'self' data: https://fonts.gstatic.com",

  // Images: avatars (Google), NFT art (Arweave), Supabase storage, GA4
  // measurement pixel (doubleclick). data:/blob: cover inline SVGs,
  // canvas-confetti, and wallet QR codes. Supabase stays a wildcard here
  // (API fallback); the app's middleware CSP pins it.
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://arweave.net https://*.arweave.net https://*.supabase.co https://stats.g.doubleclick.net",

  // Network: Supabase (REST + realtime wss), Solana/Helius RPC, Google
  // OAuth/identity, and analytics (GA4, PostHog, Sentry). Wildcards here
  // because this fallback is build-time; the app's middleware CSP pins
  // Supabase + the Solana RPC to concrete hosts at request time.
  // PostHog/Sentry stay wildcards in both — regional/multi-subdomain ingest
  // hosts, pinning risks breakage.
  [
    "connect-src 'self'",
    "https://*.supabase.co wss://*.supabase.co",
    "https://*.helius-rpc.com https://api.devnet.solana.com https://api.mainnet-beta.solana.com",
    // web3.js opens a wss:// to the RPC for subscriptions (deploy confirmation).
    "wss://*.helius-rpc.com wss://api.devnet.solana.com wss://api.mainnet-beta.solana.com",
    "https://accounts.google.com https://*.googleapis.com",
    "https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://stats.g.doubleclick.net",
    "https://*.posthog.com https://*.sentry.io https://*.ingest.sentry.io",
    // Dynamic embedded wallets — kept in sync with lib/csp.ts. Not strictly
    // needed on /api/* (the SDK only runs on app pages), but this fallback's
    // contract is "rough sync with the middleware CSP". relay.dynamicauth.com
    // is the WaaS MPC relay (wallet creation + signing).
    "https://app.dynamicauth.com https://logs.dynamicauth.com https://relay.dynamicauth.com https://dynamic-static-assets.com https://iconic.dynamic-static-assets.com",
  ].join(" "),

  // Frames: Google OAuth may use frames; lesson videos embed the YouTube and
  // Vimeo players; webview.dynamicauth.com is Dynamic's embedded-wallet
  // webview. Keep in sync with the per-request CSP in src/lib/csp.ts.
  "frame-src 'self' https://accounts.google.com https://www.youtube.com https://player.vimeo.com https://webview.dynamicauth.com",

  // Workers: code sandbox + Monaco spawn workers from blob: URLs; Monaco also
  // loads its language workers (ts/json/css/html) directly from the jsdelivr CDN.
  "worker-src 'self' blob: https://cdn.jsdelivr.net",

  // Forms may post to self and the Google OAuth endpoint.
  "form-action 'self' https://accounts.google.com",

  // Hardening directives.
  "base-uri 'self'",
  "object-src 'none'",
  // 'none', not 'self' (#437): nothing frames this app. `frame-src` above is the
  // separate, still-needed allowance for US framing YouTube/Vimeo/Google.
  "frame-ancestors 'none'",
];

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // DENY, not SAMEORIGIN (#437). SAMEORIGIN existed for the Sanity Studio
    // iframe embed, deleted in #429; nothing frames this app now. Kept in step
    // with `frame-ancestors 'none'` in the CSP above — that directive is what
    // modern browsers actually enforce, and this header is the fallback for the
    // ones that do not. Tightening only one of the two would be cosmetic.
    key: "X-Frame-Options",
    value: "DENY",
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

// Static CSP header, applied ONLY to routes the middleware skips (`/api/*`).
// Matched app routes get the per-request nonce CSP from middleware, which
// overrides this where both apply.
const staticCspHeader = {
  key: "Content-Security-Policy",
  value: cspDirectives.join("; "),
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // src/instrumentation.ts runs at startup (validates env vars). The
  // instrumentation hook is stable in Next 15, so no experimental opt-in is
  // needed — the file is picked up automatically.
  experimental: {
    // Tree-shake the per-icon barrel so only the icons a client component
    // actually imports land in its bundle (55+ named-import sites across the
    // app). Named imports only — no namespace/dynamic imports of the package.
    // The legacy Dynamic SDK (~11MB behind one barrel) used to be listed here
    // too, as a failed mitigation for the build OOM it caused; the headless
    // `@dynamic-labs-sdk/*` packages are small and properly split, so they
    // need no entry.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  // The server-side challenge executor (lib/challenge/executor.ts) runs learner
  // code in QuickJS-on-WASM. Keep these packages EXTERNAL so webpack does not
  // re-bundle the single-file variant — its WASM is embedded via octal escapes
  // in a template literal, which Node's module loader rejects once webpack has
  // re-emitted it. Left external, Node loads the package's own (valid) file and
  // Next's output file tracing still includes it (the WASM travels inside the
  // JS, so there is no separate .wasm artifact to trace).
  //
  // `serverComponentsExternalPackages` (experimental in Next 14) graduated to
  // the stable top-level `serverExternalPackages` in Next 15.
  serverExternalPackages: [
    "quickjs-emscripten-core",
    "@jitl/quickjs-singlefile-cjs-release-sync",
  ],
  transpilePackages: ["@superteam-lms/types"],
  // WalletConnect (a transitive of the wallet stack) ships `pino`, which
  // dynamically requires its OPTIONAL pretty-printer — webpack resolves the
  // require eagerly and hard-fails the build on the missing module. These are
  // genuinely optional at runtime (dev-CLI conveniences), so the right fix is
  // to leave them unresolved, not to install them: this is the canonical
  // WalletConnect/Next.js recipe. `lokijs` and `encoding` are the same
  // pattern one import deeper; webpack stops at the FIRST missing module, so
  // they are included up front rather than discovered one failed build at a
  // time. NOT related to serverExternalPackages above, which keeps packages
  // out of the bundle for correctness — this keeps modules that do not exist
  // from failing resolution.
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
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
        // API routes are excluded from middleware. They serve JSON/binary,
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
