import "server-only";

import { unstable_cache } from "next/cache";
import { ERROR_IDS } from "@/constants/errorIds";
import { keepInvocationAlive } from "@/lib/cache/keep-alive";
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
    // keepInvocationAlive: the lesson page renders under loading.tsx, so a
    // stale-entry refresh started here is otherwise frozen mid-flight when the
    // response ends (see lib/cache/keep-alive.ts).
    const { data, error } = await keepInvocationAlive(
      admin
        .rpc("course_lesson_completion_counts", { p_course_id: courseId })
        // Postgres runs this in ~10 ms; the HTTP round trip through the
        // Supabase gateway is p50 ~380 ms, p95 ~600 ms, max ~1.1 s (24 h of
        // edge logs). 1.5 s caps what a decorative chip can add to TTFB on a
        // cache miss.
        .abortSignal(AbortSignal.timeout(COMPLETION_COUNTS_TIMEOUT_MS))
    );

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
