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
 * The chip must never block or break the lesson render: any failure (RPC
 * error, thrown fetch, missing env) degrades to 0, which the caller treats as
 * "below the floor — render no chip". Errors are logged, not thrown; a throw
 * writes nothing to the cache, so the next request simply retries.
 */
const fetchCourseCompletionCounts = unstable_cache(
  async (courseId: string): Promise<Record<string, number>> => {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("course_lesson_completion_counts", {
      p_course_id: courseId,
    });
    if (error) {
      throw new Error(
        `Failed to load lesson completion counts for ${courseId}: ${error.message}`
      );
    }
    return Object.fromEntries(
      (data ?? []).map((r) => [r.lesson_id, r.completed_by])
    );
  },
  ["lesson-completion-counts"],
  { revalidate: 300 }
);

export async function getLessonCompletionCount(
  courseId: string,
  lessonId: string
): Promise<number> {
  try {
    const counts = await fetchCourseCompletionCounts(courseId);
    return counts[lessonId] ?? 0;
  } catch (err) {
    logError({
      errorId: ERROR_IDS.LESSON_COMPLETION_COUNT_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: {
        courseId,
        lessonId,
        note: "getLessonCompletionCount degraded to 0",
      },
    });
    return 0;
  }
}
