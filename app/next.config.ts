import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-react-ui",
      "@solana/web3.js",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "superteam-academy-six.vercel.app" },
    ],
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "encoding");
    return config;
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG ?? "",
  project: process.env.SENTRY_PROJECT ?? "",
  silent: true,
  sourcemaps: { disable: true },
});
