// app/next.config.js
/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

// Без аргументов плагин сам найдет ./src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

module.exports = withNextIntl(nextConfig);