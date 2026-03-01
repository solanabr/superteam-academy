import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations:
    process.env.NODE_ENV === "production" ? [Sentry.replayIntegration()] : [],
  enabled: process.env.NODE_ENV === "production",
});
