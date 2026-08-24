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

// Browser sessions are already tracked (`browserSessionIntegration` is a default
// integration in SDK v10) — what was missing is a RELEASE to attribute them to,
// and crash-free-session rate is computed per release, so without one the health
// panel stays empty. `withSentryConfig` injects `_sentryRelease` only when the
// build creates a Sentry release, which needs SENTRY_AUTH_TOKEN/ORG/PROJECT; on
// a deploy without those there is no release at all. Vercel's system env gives us
// the same commit SHA the Sentry CLI would have picked, so the two agree when
// both are present. Spread conditionally: a literal `release: undefined` would
// override the injected value (the SDK spreads our options last).
const release = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // 100% of transactions in dev, 10% in production.
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    ...(release ? { release } : {}),
  });

  // A malformed DSN makes `init` bail without a client — and with `debug`
  // statements stripped from production bundles, that failure is otherwise
  // invisible. Shout, so a broken error pipeline is caught on first load.
  if (!Sentry.getClient()) {
    console.error(
      "[sentry] DSN rejected — errors are NOT being reported (check NEXT_PUBLIC_SENTRY_DSN)"
    );
  }
}

// Instruments App Router navigations for tracing. Safe to export even when the
// SDK is uninitialized — it short-circuits without an active client.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
