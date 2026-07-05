import "server-only";
import { logError } from "@/lib/logging";

/**
 * A concise, safe reason for a failed teacher Sanity write. The common cause is
 * a missing/read-only SANITY_ADMIN_TOKEN, so map permission-shaped errors to an
 * actionable hint; otherwise fall back to the (capped) error message. Reasons
 * describe server/operational state, never user data — safe to return.
 */
export function describeTeacherWriteError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    /unauthorized|permission|not allowed|insufficient|forbidden|token|session/i.test(
      msg
    )
  ) {
    return "Sanity write was rejected — verify SANITY_ADMIN_TOKEN is set and write-enabled on the server";
  }
  return msg.slice(0, 300);
}

/**
 * Log a teacher-write failure (so it's visible in server logs) and return the
 * reason to include in the 500 response body.
 */
export function reportTeacherWriteError(
  errorId: string,
  err: unknown,
  context: Record<string, unknown>
): string {
  logError({
    errorId,
    error: err instanceof Error ? err : new Error(String(err)),
    context,
  });
  return describeTeacherWriteError(err);
}
