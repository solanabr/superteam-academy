/**
 * Sentry edge-runtime initialization (middleware + edge routes).
 *
 * Imported from `src/instrumentation.ts` (`register()`) when
 * `NEXT_RUNTIME === "edge"`. `Sentry.init` runs only when
 * `NEXT_PUBLIC_SENTRY_DSN` is set, so it is a no-op when unconfigured.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  });
}
