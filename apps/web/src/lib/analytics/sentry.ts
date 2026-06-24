/**
 * Sentry error-tracking wrapper.
 *
 * The SDK is initialized by `@sentry/nextjs` via the instrumentation files
 * (`src/instrumentation-client.ts`, `sentry.server.config.ts`,
 * `sentry.edge.config.ts`), each gated on `NEXT_PUBLIC_SENTRY_DSN`. This module
 * only exposes thin helpers used by the analytics facade; when the DSN is unset
 * Sentry has no active client and every call here is a silent no-op.
 */
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

function isConfigured(): boolean {
  return SENTRY_DSN.length > 0;
}

/**
 * Retained for the analytics facade's init flow. Initialization itself happens
 * in the Sentry instrumentation files; this is a no-op kept for API stability.
 */
export async function initSentry(): Promise<void> {
  // Intentionally empty — init is owned by the instrumentation hook + configs.
}

/**
 * Capture an error in Sentry with optional context.
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (!isConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Sentry fallback]", error, context);
    }
    return;
  }

  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Set the current user context for Sentry error reports.
 */
export function setSentryUser(userId: string): void {
  if (!isConfigured()) return;
  Sentry.setUser({ id: userId });
}
