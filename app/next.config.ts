import type { NextConfig } from "next";

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

export default nextConfig;
