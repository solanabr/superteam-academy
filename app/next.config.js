/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Solana wallet adapter + Node polyfills
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false };
    }
    config.externals.push('pino-pretty', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
