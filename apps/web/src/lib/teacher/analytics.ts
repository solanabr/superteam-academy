import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const RECENT_DAYS = 7;

export interface LessonFunnelRow {
  lessonId: string;
  title: string;
  /** Distinct learners who have completed this lesson. */
  completedBy: number;
}

export interface CourseAnalytics {
  /** completions / enrolled, 0..1 (0 when no enrollments). */
  completionRate: number;
  recentEnrollments: number;
  recentCompletions: number;
  /** Estimated XP handed out: completed lessons × the course's per-lesson XP. */
  xpAwarded: number;
  /** Per-lesson completion in course order — the drop-off funnel. */
  funnel: LessonFunnelRow[];
  recentWindowDays: number;
}

/**
 * Richer per-course analytics for the teacher overview (#286). SERVER-ONLY; the
 * caller must verify course ownership first.
 *
 * `completionRate` uses the SAME course-completion signal as the headline
 * `completionCount` (enrollments with `completed_at` set) so the two views never
 * disagree; the `funnel` is a separate per-lesson drill-down from
 * `user_progress` and is not re-defining "completed the course".
 */
export async function getCourseAnalytics(
  courseId: string,
  orderedLessons: { _id: string; title: string | null }[],
  xpPerLesson: number,
  enrolledCount: number,
  completionCount: number
): Promise<CourseAnalytics> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString();

  const [recentEnr, recentComp, counts] = await Promise.all([
    admin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .gte("enrolled_at", cutoff),
    admin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .gte("completed_at", cutoff),
    // Aggregate per-lesson completions IN Postgres (one row per lesson) — a raw
    // row fetch would be silently capped at max_rows (1000) and under-report the
    // funnel + XP for busy courses. See course_lesson_completion_counts.
    admin.rpc("course_lesson_completion_counts", { p_course_id: courseId }),
  ]);

  const perLesson = new Map<string, number>();
  let totalCompletedLessons = 0;
  for (const row of counts.data ?? []) {
    perLesson.set(row.lesson_id, row.completed_by);
    totalCompletedLessons += row.completed_by;
  }

  const funnel: LessonFunnelRow[] = orderedLessons.map((l) => ({
    lessonId: l._id,
    title: l.title ?? "",
    completedBy: perLesson.get(l._id) ?? 0,
  }));

  return {
    completionRate: enrolledCount > 0 ? completionCount / enrolledCount : 0,
    recentEnrollments: recentEnr.count ?? 0,
    recentCompletions: recentComp.count ?? 0,
    xpAwarded: totalCompletedLessons * (xpPerLesson || 0),
    funnel,
    recentWindowDays: RECENT_DAYS,
  };
}
