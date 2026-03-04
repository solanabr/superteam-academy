import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const isLocalWindows = process.platform === "win32" && process.env.CI !== "true";

const nextConfig: NextConfig = {
  // ── Turbopack HMR fix ─────────────────────────────────────────────────────
  // superstruct (a dep of @solana/web3.js) ships ESM-only from its "import"
  // export condition. Turbopack loses the ESM module factory between HMR
  // cycles, causing the "module factory is not available" crash.
  //
  // Two-part fix:
  //  1. transpilePackages: Next.js compiles superstruct through SWC into a
  //     stable bundle instead of relying on native ESM module identity.
  //  2. resolveAlias: point Turbopack's resolver at the CJS build so a
  //     single require()-based instance is shared across all hot-reload chunks.
  transpilePackages: ["superstruct"],

  turbopack: {
    resolveAlias: {
      superstruct: "superstruct/lib/index.cjs",
    },
  },

  experimental: {
    clientTraceMetadata: [],
    workerThreads: isLocalWindows,
  },

  // Dedicated gate scripts run type-check and lint separately.
  // On local Windows only, skip duplicate Next.js type-check during build to avoid EPERM issues.
  typescript: {
    ignoreBuildErrors: isLocalWindows,
  },

  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy-Report-Only",
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms; connect-src 'self' https: wss:; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

// Avoid local Windows build EPERM from sentry-cli spawn when no auth token is set.
const shouldEnableSentryBuildPlugin = Boolean(process.env.SENTRY_AUTH_TOKEN);

const baseConfig = withNextIntl(nextConfig);

export default shouldEnableSentryBuildPlugin
  ? withSentryConfig(baseConfig, {
      silent: true,
      org: "superteam",
      project: "academy",
    })
  : baseConfig;
