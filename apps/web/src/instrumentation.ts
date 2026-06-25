/**
 * Next.js instrumentation hook — runs once at server startup.
 *
 * Two concerns:
 * 1. Eagerly validate environment variables so a missing/malformed var fails
 *    fast with a clear, named error instead of a deep SDK crash at first request.
 * 2. Initialize Sentry for the active runtime (Node.js or Edge). Each config
 *    no-ops when `NEXT_PUBLIC_SENTRY_DSN` is unset.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env");
    await import("@/lib/env.server");
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Captures errors from Server Components, route handlers, middleware, and the
// nested React Server Components render. No-op until Sentry.init has run.
export const onRequestError = Sentry.captureRequestError;
