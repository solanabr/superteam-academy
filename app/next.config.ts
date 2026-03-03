import type { NextConfig } from "next";
import path from "path";
// next-intl plugin enabled
import createNextIntlPlugin from "next-intl/plugin";
// Point to the request config in the i18n folder (relative to project root usually, or use absolute path)
// Documentation says: createNextIntlPlugin('./i18n/request.ts')
// My file is at app/i18n/request.ts. The config file is at app/next.config.ts.
// So './i18n/request.ts' is correct relative to next.config.ts.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * fill-rule / clip-rule fix: We actually REWRITE dependency source (not hide warnings).
 * - Postinstall (fix-appkit-ui-svg.js): patches node_modules on disk (fill-rule= → fillRule=, etc.).
 * - Webpack below: same replace at bundle time for production so the fix is applied regardless of resolution.
 * - Turbopack: we do NOT run this loader in dev (empty turbopack: {}) because it forced CJS on ESM and broke @privy-io/chains; dev relies on the postinstall patch only.
 */
const svgAttrReplace = {
  loader: "string-replace-loader",
  options: {
    multiple: [
      { search: "fill-rule=", replace: "fillRule=" },
      { search: "clip-rule=", replace: "clipRule=" },
    ],
  },
};

import { withSentryConfig } from "@sentry/nextjs";

const nodeModulesPath = path.join(__dirname, "node_modules");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
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
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  // Satisfy Next 16: having webpack config requires a turbopack key (empty = no custom Turbopack).
  turbopack: {},
  // SVG fix only in webpack (production build). Not in Turbopack to avoid CJS/ESM conflict on @privy-io/chains.
  // Dev relies on postinstall script (fix-appkit-ui-svg.js) for node_modules patch.
  webpack: (config, { isServer }) => {
    config.module ??= { rules: [] };
    const rules = config.module.rules as Array<{
      enforce?: "pre";
      test?: RegExp;
      include?: string;
      use?: unknown;
    }>;
    rules.unshift({
      enforce: "pre",
      test: /\.(m?js|cjs\.js|umd\.js)$/,
      include: nodeModulesPath,
      use: svgAttrReplace,
    });


    return config;
  },
};

// Wrap with next-intl FIRST, then with Sentry
const intlConfig = withNextIntl(nextConfig);

export default withSentryConfig(intlConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#use-hidden-source-map
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and McR
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your Sentry quota.
  // tunnelRoute: "/monitoring",

  // Hides source maps from visitors

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router config route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
