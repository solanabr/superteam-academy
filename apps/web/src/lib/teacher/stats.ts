import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CourseStats {
  /** Learners enrolled in the course. */
  enrolledCount: number;
  /** Enrollments the learner has finished (course finalized on-chain). */
  completionCount: number;
  /** Credential NFTs minted for the course. */
  certificateCount: number;
}

/**
 * Aggregate a course's headline stats from Supabase. SERVER-ONLY; the caller
 * (teacher API / overview page) must verify course ownership first. Uses the
 * service-role client with head+count queries (no rows transferred).
 * `course_id` is the Sanity course _id, as used across enrollments/certificates.
 */
export async function getCourseStats(courseId: string): Promise<CourseStats> {
  const admin = createAdminClient();

  const [enrolled, completed, certs] = await Promise.all([
    admin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId),
    admin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .not("completed_at", "is", null),
    admin
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId),
  ]);

  return {
    enrolledCount: enrolled.count ?? 0,
    completionCount: completed.count ?? 0,
    certificateCount: certs.count ?? 0,
  };
}
