import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import "@/lib/env";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
