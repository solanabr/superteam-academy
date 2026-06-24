import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable the instrumentation hook so src/instrumentation.ts runs at startup
  // (validates env vars). Stable in Next 15; opt-in in Next 14.
  experimental: {
    instrumentationHook: true,
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
};

export default withNextIntl(nextConfig);
