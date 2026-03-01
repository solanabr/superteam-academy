import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.3,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export const onRequestError = Sentry.captureRequestError;
