interface LogErrorParams {
  errorId: string;
  error: Error;
  context?: Record<string, unknown>;
}

export function logError({ errorId, error, context }: LogErrorParams): void {
  console.error(`[${errorId}]`, error.message, context ?? "");
}

type LogLevel = "info" | "warn" | "error";

interface LogEventParams {
  /** Stable, greppable event name, e.g. `deploy-save.rejected`. */
  event: string;
  /** Console severity. Defaults to `warn`. */
  level?: LogLevel;
  /** Structured, JSON-serializable fields. No secrets/PII beyond ids. */
  context?: Record<string, unknown>;
}

/**
 * Structured event log for paths that must be observable but are not errors —
 * denials, fail-closed rejections, and notable successes. The point is that
 * silence is a bug: a broken write path (e.g. `/api/deploy/save`, #725) whose
 * every rejection returns a generic message is otherwise indistinguishable
 * from correct behaviour in the logs. Emits a single greppable
 * `[event] {…context}` line at the given level.
 */
export function logEvent({
  event,
  level = "warn",
  context,
}: LogEventParams): void {
  const sink =
    level === "error"
      ? console.error
      : level === "info"
        ? console.info
        : console.warn;
  sink(`[${event}]`, context ?? "");
}
