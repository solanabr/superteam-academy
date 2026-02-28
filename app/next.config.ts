// Force Sentry CLI to use EU region
if (!process.env.SENTRY_URL) process.env.SENTRY_URL = 'https://de.sentry.io';

import type { NextConfig } from "next";
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin();

// When Sentry credentials are absent, alias @sentry/nextjs to a no-op stub.
// This removes ~120 KB of Sentry SDK from the initial JS bundle, improving
// LCP and TBT scores significantly.
const sentryStubPath = path.resolve('./lib/sentry-stub.ts');
const useSentryStub = !process.env.SENTRY_ORG;

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  webpack(config) {
    if (useSentryStub) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/nextjs': sentryStubPath,
      };
    }
    return config;
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'recharts',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-phantom',
      '@solana/web3.js',
    ],
  },
  images: {
    remotePatterns: [
      // Sanity CMS image CDN
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
      // Google user profile pictures (for Google sign-in)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/:path*.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/:path*.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/:path*.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io https://www.googletagmanager.com https://*.clarity.ms; connect-src 'self' https://api.devnet.solana.com https://*.sentry.io https://*.sanity.io https://www.google-analytics.com https://*.google-analytics.com https://*.clarity.ms wss:; img-src 'self' data: blob: https://cdn.sanity.io https://lh3.googleusercontent.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self';" },
        ],
      },
    ];
  },
};

// Only wrap with Sentry when credentials are present (avoids bundle overhead in dev/without config)
const configuredNext = withNextIntl(nextConfig);
export default process.env.SENTRY_ORG
  ? withSentryConfig(configuredNext, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      sentryUrl: process.env.SENTRY_URL || 'https://de.sentry.io',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : configuredNext;
