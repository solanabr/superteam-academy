import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://app.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://cdn.sanity.io https://arweave.net https://lh3.googleusercontent.com https://avatars.githubusercontent.com; connect-src 'self' https://cdn.sanity.io https://*.helius-rpc.com https://www.google-analytics.com https://app.posthog.com https://www.clarity.ms https://*.sentry.io https://*.ingest.sentry.io https://www.googletagmanager.com; font-src 'self'; frame-src https://www.youtube.com https://player.vimeo.com;",
          },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-progress",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-label",
      "@solana/wallet-adapter-wallets",
      "@coral-xyz/anchor",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "arweave.net" },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      buffer: false,
    };
    config.externals.push("pino-pretty", "encoding");
    return config;
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  org: "superteam-academy",
  project: "superteam-academy",
  // Disable source map upload — no auth token configured yet.
  // This also prevents the Sentry webpack plugin from running post-build steps
  // that are incompatible with Turbopack (pages-manifest.json lookup).
  sourcemaps: { disable: true },
  telemetry: false,
});
