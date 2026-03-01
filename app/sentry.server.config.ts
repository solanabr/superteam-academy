import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NEXT_PUBLIC_CLUSTER || 'devnet',
  enabled: !!process.env.SENTRY_DSN,
});
