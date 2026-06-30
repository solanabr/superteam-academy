import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

/**
 * Content-Security-Policy.
 *
 * This is an ENFORCING policy tuned to keep every legitimate integration
 * working. Where a directive can't be locked down without breaking runtime
 * behaviour it is left permissive on purpose (see inline `unsafe-*` notes and
 * `TODO tighten` markers). Tightening any of these requires runtime QA of the
 * affected feature first.
 *
 * Notable allowances:
 * - `'unsafe-eval'` in script-src — REQUIRED. The in-browser code-challenge
 *   sandbox (`components/editor/challenge-runner.tsx`) runs learner code via
 *   `new Function()`, and Monaco's tokenizer/worker bootstrap also relies on
 *   it. Removing it WILL break the editor and challenge runner.
 * - `'unsafe-inline'` in script-src/style-src — Next.js injects an inline
 *   bootstrap script and inline critical CSS; nonces are not wired up.
 * - Server-only externals (Gemini, Rust Playground, build server) are NOT
 *   listed: the browser only ever talks to same-origin `/api/*` routes that
 *   proxy them.
 *
 * KNOWN DEFERRED LIMITATION: `'unsafe-inline'` + `'unsafe-eval'` keep the
 * script CSP weak — together they neutralise CSP's XSS protection for inline
 * and eval'd scripts. Closing this requires a nonce- (or hash-) based script
 * CSP wired through Next.js's inline bootstrap; that is intentionally NOT
 * attempted here. Tracked by the `TODO tighten` marker below.
 */
const cspDirectives = [
  "default-src 'self'",

  // Scripts: self + GA4 tag loader + PostHog. 'unsafe-eval' for the code
  // sandbox / Monaco; 'unsafe-inline' for the Next.js bootstrap + analytics
  // snippets; blob: for Monaco/worker bootstrap; jsdelivr for the Monaco
  // editor loader (@monaco-editor/react fetches loader.js + vs/* from the CDN).
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://www.googletagmanager.com https://*.posthog.com",

  // Styles: 'unsafe-inline' required by Next.js (and Sanity Studio) inline CSS.
  "style-src 'self' 'unsafe-inline' https://cdn.sanity.io",

  // Fonts: self-hosted via next/font. gstatic kept as a harmless fallback.
  "font-src 'self' data: https://fonts.gstatic.com",

  // Images: avatars (Google), NFT art (Arweave), Supabase storage, Sanity CDN +
  // Studio media library, GA4 measurement pixel (doubleclick). data:/blob:
  // cover inline SVGs, canvas-confetti, and wallet QR codes.
  "img-src 'self' data: blob: https://cdn.sanity.io https://media.sanity.io https://lh3.googleusercontent.com https://arweave.net https://*.arweave.net https://*.supabase.co https://stats.g.doubleclick.net",

  // Network: Supabase (REST + realtime wss), Sanity (CDN/API + listen wss),
  // Solana/Helius RPC, Google OAuth/identity, and analytics (GA4, PostHog,
  // Sentry). Wildcards because project subdomains differ per environment.
  // TODO tighten — pin Supabase/Helius/Sanity to concrete project subdomains
  // once the production hostnames are fixed.
  [
    "connect-src 'self'",
    "https://*.supabase.co wss://*.supabase.co",
    "https://api.sanity.io https://cdn.sanity.io https://*.apicdn.sanity.io https://*.api.sanity.io wss://*.api.sanity.io https://media.sanity.io",
    "https://*.helius-rpc.com https://api.devnet.solana.com https://api.mainnet-beta.solana.com",
    "https://accounts.google.com https://*.googleapis.com",
    "https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://stats.g.doubleclick.net",
    "https://*.posthog.com https://*.sentry.io https://*.ingest.sentry.io",
  ].join(" "),

  // Frames: Sanity Studio is a same-origin embed; Google OAuth may use frames.
  "frame-src 'self' https://accounts.google.com",

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
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable the instrumentation hook so src/instrumentation.ts runs at startup
  // (validates env vars). Stable in Next 15; opt-in in Next 14.
  experimental: {
    instrumentationHook: true,
    // `isolated-vm` is a native addon used by the server-side challenge
    // executor (lib/challenge/executor.ts). Keep it external so webpack does
    // not attempt to bundle/trace the .node binary; it is required at runtime
    // on the Node.js server. The module loads lazily and degrades closed if the
    // prebuilt binary is unavailable in the host environment.
    serverComponentsExternalPackages: ["isolated-vm"],
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
        source: "/:path*",
        headers: securityHeaders,
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
