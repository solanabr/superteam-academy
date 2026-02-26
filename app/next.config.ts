import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Acknowledge Turbopack when webpack is also configured (e.g. for production build).
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/9.x/**",
      },
    ],
  },
  webpack: (config) => {
    // Prefer production builds of dependencies (e.g. lit from WalletConnect)
    // to avoid "Lit is in dev mode" console warning.
    config.resolve.conditionNames = [
      "production",
      "import",
      "require",
      "default",
    ];
    return config;
  },
};

const configWithIntl = withNextIntl(nextConfig);
export default withSentryConfig(configWithIntl, {
  org: process.env.SENTRY_ORG ?? "",
  project: process.env.SENTRY_PROJECT ?? "",
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
