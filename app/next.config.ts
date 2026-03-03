import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import "@/lib/env";

const withNextIntl = createNextIntlPlugin();

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const isEu = posthogHost.includes("eu.i.posthog.com");
const assetsHost = isEu
  ? "https://eu-assets.i.posthog.com"
  : "https://us-assets.i.posthog.com";
const apiHost = isEu ? "https://eu.i.posthog.com" : "https://us.i.posthog.com";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@walletconnect/universal-provider": false,
    };
    return config;
  },
  async rewrites() {
    return [
      { source: "/ph/static/:path*", destination: `${assetsHost}/static/:path*` },
      { source: "/ph/:path*", destination: `${apiHost}/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
