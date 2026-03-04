import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture 10% of transactions for performance monitoring in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture 100% of replays for errors, 1% for general sessions
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Don't send errors in development unless DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
