import type { ProgressService } from "../progress-service";
import type { CourseProgress } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function rowToProgress(row: Record<string, unknown>): CourseProgress {
  const completed = (row.completed_lessons as number[]) ?? [];
  const total = (row.total_lessons as number) || 0;

  return {
    courseId: row.course_id as string,
    completedLessons: completed,
    totalLessons: total,
    completionPercentage: total > 0 ? (completed.length / total) * 100 : 0,
    isCompleted: (row.is_completed as boolean) ?? false,
    isFinalized: (row.is_finalized as boolean) ?? false,
    enrolledAt: row.enrolled_at as string,
    completedAt: (row.completed_at as string) ?? null,
    xpEarned: (row.xp_earned as number) ?? 0,
  };
}

export const supabaseProgressService: ProgressService = {
  async getProgress(userId, courseId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    return data ? rowToProgress(data) : null;
  },

  async getAllProgress(userId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("*")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    return (data ?? []).map(rowToProgress);
  },

  async completeLesson(userId, courseId, lessonIndex, xp) {
    const supabase = createSupabaseBrowserClient();

    // Fetch current progress
    const { data: current } = await supabase
      .from("course_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!current) throw new Error("Not enrolled in this course");

    const completed: number[] = current.completed_lessons ?? [];
    if (completed.includes(lessonIndex)) {
      return rowToProgress(current);
    }

    const updatedLessons = [...completed, lessonIndex];
    const total = current.total_lessons || 0;
    const isCompleted = total > 0 && updatedLessons.length >= total;

    const { data, error } = await supabase
      .from("course_progress")
      .update({
        completed_lessons: updatedLessons,
        xp_earned: (current.xp_earned ?? 0) + xp,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToProgress(data);
  },

  async finalizeCourse(userId, courseId) {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("course_progress")
      .update({
        is_finalized: true,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToProgress(data);
  },

  async getTotalXPEarned(userId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("xp_earned")
      .eq("user_id", userId);

    return (data ?? []).reduce(
      (sum, row) => sum + ((row.xp_earned as number) ?? 0),
      0,
    );
  },

  async getCompletedCourseCount(userId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("is_completed", true);

    return data?.length ?? 0;
  },
};
