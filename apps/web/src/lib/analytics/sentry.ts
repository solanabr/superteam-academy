/**
 * Sentry error tracking wrapper.
 *
 * Uses @sentry/nextjs for error monitoring. Only initializes when SENTRY_DSN
 * is set. All calls gracefully degrade to no-ops when the env var is missing.
 *
 * NOTE: @sentry/nextjs must be installed separately:
 *   pnpm add @sentry/nextjs --filter @superteam-lms/web
 *
 * After installing, you should also run the Sentry wizard to generate the
 * sentry.client.config.ts, sentry.server.config.ts, and sentry.edge.config.ts
 * files at the app root:
 *   npx @sentry/wizard@latest -i nextjs
 */

interface SentryLike {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: Error, context?: Record<string, unknown>) => void;
  setUser: (user: { id: string } & Record<string, unknown>) => void;
  withScope: (callback: (scope: SentryScopeLike) => void) => void;
}

interface SentryScopeLike {
  setExtras: (extras: Record<string, unknown>) => void;
}

const SENTRY_DSN = process.env.SENTRY_DSN ?? "";

let sentry: SentryLike | null = null;
let initAttempted = false;

function isConfigured(): boolean {
  return SENTRY_DSN.length > 0;
}

/**
 * Initialize Sentry. Safe to call multiple times; will only init once.
 * Dynamically imports @sentry/nextjs so it is not bundled when unused.
 */
export async function initSentry(): Promise<void> {
  if (!isConfigured() || initAttempted) return;

  initAttempted = true;

  try {
    // Dynamic import with variable to bypass TypeScript module resolution
    // when @sentry/nextjs is not installed as a dependency
    const moduleName = "@sentry/nextjs";
    const imported = await import(/* webpackIgnore: true */ moduleName);
    const sentryModule = imported as unknown as SentryLike;

    sentryModule.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    });

    sentry = sentryModule;
  } catch {
    // @sentry/nextjs is not installed — degrade silently
    sentry = null;
  }
}

/**
 * Capture an error in Sentry with optional context.
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (!sentry) {
    // Fallback: log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[Sentry fallback]", error, context);
    }
    return;
  }

  if (context) {
    sentry.withScope((scope) => {
      scope.setExtras(context);
      sentry!.captureException(error);
    });
  } else {
    sentry.captureException(error);
  }
}

/**
 * Set the current user context for Sentry error reports.
 */
export function setSentryUser(userId: string): void {
  if (!sentry) return;
  sentry.setUser({ id: userId });
}
