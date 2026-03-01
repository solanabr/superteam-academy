import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "**.helius-rpc.com" },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
