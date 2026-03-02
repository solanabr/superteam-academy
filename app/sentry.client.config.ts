import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.02,
  replaysOnErrorSampleRate: 0.5,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
