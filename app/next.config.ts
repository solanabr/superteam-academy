import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import "@/lib/env";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default withNextIntl(nextConfig);
