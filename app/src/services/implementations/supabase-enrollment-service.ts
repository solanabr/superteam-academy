import type { EnrollmentService } from "../enrollment-service";
import type { Enrollment } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export const supabaseEnrollmentService: EnrollmentService = {
  async enroll(userId, courseId) {
    const supabase = createSupabaseBrowserClient();
    const now = Date.now();

    const { data, error } = await supabase
      .from("course_progress")
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          completed_lessons: [],
          total_lessons: 0,
          is_completed: false,
          is_finalized: false,
          xp_earned: 0,
          enrolled_at: new Date(now).toISOString(),
        },
        { onConflict: "user_id,course_id" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      courseId: data.course_id,
      learner: userId,
      lessonFlags: [],
      enrolledAt: now,
      completedAt: null,
      credentialAsset: null,
    } satisfies Enrollment;
  },

  async getEnrollment(userId, courseId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!data) return null;

    return {
      courseId: data.course_id,
      learner: userId,
      lessonFlags: [],
      enrolledAt: new Date(data.enrolled_at).getTime(),
      completedAt: data.completed_at
        ? new Date(data.completed_at).getTime()
        : null,
      credentialAsset: null,
    } satisfies Enrollment;
  },

  async getEnrollments(userId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("*")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    return (data ?? []).map(
      (row) =>
        ({
          courseId: row.course_id,
          learner: userId,
          lessonFlags: [],
          enrolledAt: new Date(row.enrolled_at).getTime(),
          completedAt: row.completed_at
            ? new Date(row.completed_at).getTime()
            : null,
          credentialAsset: null,
        }) satisfies Enrollment,
    );
  },

  async isEnrolled(userId, courseId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    return !!data;
  },

  async closeEnrollment(userId, courseId) {
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("course_progress")
      .delete()
      .eq("user_id", userId)
      .eq("course_id", courseId);
  },
};
