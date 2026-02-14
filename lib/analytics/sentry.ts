type SentryApi = {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    Sentry?: SentryApi;
  }
}

export function captureAppError(error: unknown, context?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.Sentry) {
    return;
  }

  window.Sentry.captureException(error, context);
}
