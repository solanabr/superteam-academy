/** @type {import('next').NextConfig} */

const createNextIntlPlugin = require('next-intl/plugin');

// Point the plugin at your i18n config file
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig = {
  // Ignore ESLint & TS errors during Vercel build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config, { isServer }) => {
    // Solana Web3.js requires polyfills for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@solana/web3.js'],
  },

  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = withNextIntl(nextConfig);
