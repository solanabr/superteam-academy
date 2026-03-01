import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// ---------------------------------------------------------------------------
// Content Security Policy
// ---------------------------------------------------------------------------

const cspDirectives = [
  // Fallback — block everything not explicitly allowed
  "default-src 'self'",

  // Scripts: self + analytics + Monaco workers from jsdelivr
  [
    "script-src 'self'",
    "'unsafe-eval'", // Monaco editor web workers
    "'unsafe-inline'", // Next.js inline scripts, analytics snippets
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://www.clarity.ms',
    'https://cdn.jsdelivr.net',
    'https://va.vercel-scripts.com',
  ].join(' '),

  // Styles: self + unsafe-inline (Tailwind runtime, Monaco themes)
  "style-src 'self' 'unsafe-inline'",

  // Images: self + data URIs + blob URIs + CDNs
  "img-src 'self' data: blob: https://cdn.sanity.io https://arweave.net https://*.arweave.net",

  // Fonts: self + data URIs (Next.js self-hosted fonts use data: for preloads)
  "font-src 'self' data:",

  // Connections: self + RPC endpoints + analytics + Vercel
  [
    "connect-src 'self'",
    'https://*.helius-rpc.com',
    'https://*.helius.dev',
    'https://api.devnet.solana.com',
    'https://api.mainnet-beta.solana.com',
    'https://www.google-analytics.com',
    'https://www.clarity.ms',
    'https://cdn.sanity.io',
    'https://arweave.net',
    'https://vitals.vercel-insights.com',
    'https://va.vercel-scripts.com',
    'wss://*.helius-rpc.com', // WebSocket RPC
  ].join(' '),

  // Workers: self + blob (Monaco spawns blob: workers)
  "worker-src 'self' blob:",

  // Child/frame sources
  "frame-src 'none'",

  // Object/embed — none needed
  "object-src 'none'",

  // Base URI — prevent <base> tag hijacking
  "base-uri 'self'",

  // Form submissions
  "form-action 'self'",

  // Manifest (PWA)
  "manifest-src 'self'",

  // Media — none needed currently
  "media-src 'self'",
];

const contentSecurityPolicy = cspDirectives.join('; ');

// ---------------------------------------------------------------------------
// Security headers applied to all routes
// ---------------------------------------------------------------------------

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

// ---------------------------------------------------------------------------
// Next.js config
// ---------------------------------------------------------------------------

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'arweave.net' },
    ],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
