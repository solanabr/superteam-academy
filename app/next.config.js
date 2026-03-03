// app/next.config.js
/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');
const withPWAInit = require('next-pwa');

// Без аргументов плагин сам найдет ./src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

const withPWA = withPWAInit({
  dest: 'public', // Папка для сервис-воркеров
  disable: process.env.NODE_ENV === 'development', // Отключаем в Dev режиме, чтобы не мешало
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false, 

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'arweave.net' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' } // на всякий случай для GitHub
    ],
  },

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


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");
let configWithPlugins = withPWA(withNextIntl(nextConfig));

module.exports = withSentryConfig(
  configWithPlugins, 
  {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "home-setup",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: true,
  hideSourceMaps: true,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  transpileClientSDK: true,
  disableLogger: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
