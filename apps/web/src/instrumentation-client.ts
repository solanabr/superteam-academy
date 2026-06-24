/**
 * Sentry client-side initialization (browser runtime).
 *
 * Auto-loaded by `@sentry/nextjs` (v8+) via the instrumentation hook, replacing
 * the legacy `sentry.client.config.ts`. `Sentry.init` runs only when
 * `NEXT_PUBLIC_SENTRY_DSN` is set, so the SDK is a no-op when unconfigured —
 * the platform works without observability.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // 100% of transactions in dev, 10% in production.
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  });
}

// Instruments App Router navigations for tracing. Safe to export even when the
// SDK is uninitialized — it short-circuits without an active client.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
