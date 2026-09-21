import "server-only";

import { unstable_cache } from "next/cache";
import { ERROR_IDS } from "@/constants/errorIds";
import { logError } from "@/lib/logging";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side read for the "N builders completed this" header chip (#942).
 *
 * Counts come from the `course_lesson_completion_counts` SECURITY DEFINER RPC
 * (EXECUTE service_role only — hence `createAdminClient()`), which aggregates
 * `user_progress` in Postgres and returns one row per lesson. One RPC per
 * course covers every lesson page in it, so the result is cached per course id
 * for 5 minutes via `unstable_cache` — the chip is social proof, not live
 * telemetry, and a slightly stale count is fine.
 *
 * WHY THE CACHE CALLBACK NEVER THROWS. It used to: an RPC error re-threw so
 * nothing was written to the data cache and the next request retried. That is
 * the right instinct for a page's own data and the wrong one here, because
 * `unstable_cache` revalidates in the BACKGROUND. A throw during revalidation
 * is not caught by the caller that asked for the value — it surfaces as
 * "revalidating cache … TypeError: fetch failed" attributed to whatever render
 * happens to be in flight, which is how a decorative chip on the lesson page
 * became 98% of the platform's runtime errors and spilled into /[locale],
 * /courses/[slug], /leaderboard and /community.
 *
 * So the callback catches, logs once under a stable code, and returns null.
 * Cost of that choice: a failure is cached, so the chip stays hidden for up to
 * the revalidate window instead of retrying on the next request. For social
 * proof that is the cheaper side of the trade.
 */
const COMPLETION_COUNTS_TIMEOUT_MS = 1_500;

type CompletionCounts = Record<string, number>;

async function loadCourseCompletionCounts(
  courseId: string
): Promise<CompletionCounts | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .rpc("course_lesson_completion_counts", { p_course_id: courseId })
      // Postgres answers this in ~11 ms (max 68 ms measured over 30 d) and
      // PostgREST caps any statement at 8 s, so anything past a second is a
      // stalled Vercel→Supabase socket, not a slow query. Unbounded, those
      // sockets hung for minutes (p95 222 s) with the lesson render waiting on
      // them; 1.5 s is ~100x the healthy round trip and caps what a decorative
      // chip can ever add to TTFB.
      .abortSignal(AbortSignal.timeout(COMPLETION_COUNTS_TIMEOUT_MS));

    if (error) throw new Error(error.message);

    return Object.fromEntries(
      (data ?? []).map((r) => [r.lesson_id, r.completed_by])
    );
  } catch (err) {
    logError({
      errorId: ERROR_IDS.LESSON_COMPLETION_COUNT_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: {
        courseId,
        note: "completion counts unavailable; chip hidden for this cache window",
      },
    });
    return null;
  }
}

const fetchCourseCompletionCounts = unstable_cache(
  loadCourseCompletionCounts,
  ["lesson-completion-counts"],
  { revalidate: 300 }
);

export async function getLessonCompletionCount(
  courseId: string,
  lessonId: string
): Promise<number> {
  // Belt and braces: the callback above already swallows its own failures, so
  // this catch only covers `unstable_cache` itself (a missing incremental
  // cache, say). Either way the chip degrades to 0, which the caller reads as
  // "below the floor — render nothing".
  try {
    const counts = await fetchCourseCompletionCounts(courseId);
    return counts?.[lessonId] ?? 0;
  } catch {
    return 0;
  }
}
