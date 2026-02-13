import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
  });
}
