import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@hugeicons/react', '@hugeicons/core-free-icons'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      {
        module: /node_modules\/@hugeicons/,
        message: /Invalid DOM property/,
      },
    ];
    return config;
  },
};

export default withNextIntl(nextConfig);
