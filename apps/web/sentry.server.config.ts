/**
 * Sentry server-side initialization (Node.js runtime).
 *
 * Imported from `src/instrumentation.ts` (`register()`) when
 * `NEXT_RUNTIME === "nodejs"`. `Sentry.init` runs only when
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

  // A malformed DSN makes `init` bail without a client — and with `debug`
  // statements stripped from production bundles, that failure is otherwise
  // invisible. Shout, so a broken error pipeline is caught at boot.
  if (!Sentry.getClient()) {
    console.error(
      "[sentry] DSN rejected — errors are NOT being reported (check NEXT_PUBLIC_SENTRY_DSN)"
    );
  }
}
