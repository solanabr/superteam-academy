import type { ProgressService } from "../progress-service";
import type { CourseProgress } from "@/types";

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
    const res = await fetch(
      `/api/progress?userId=${userId}&courseId=${encodeURIComponent(courseId)}`,
    );
    if (!res.ok) return null;
    const { progress } = await res.json();
    return progress ? rowToProgress(progress) : null;
  },

  async getAllProgress(userId) {
    const res = await fetch(`/api/progress?userId=${userId}`);
    if (!res.ok) return [];
    const { progressList } = await res.json();
    return (progressList ?? []).map(rowToProgress);
  },

  async completeLesson(userId, courseId, lessonIndex, xp) {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId, lessonIndex, xp }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      throw new Error(err.error || "Failed to complete lesson");
    }

    const { progress } = await res.json();
    return rowToProgress(progress);
  },

  async finalizeCourse(userId, courseId) {
    // Finalization uses its own dedicated API route
    const res = await fetch("/api/courses/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, userId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed" }));
      throw new Error(err.error || "Failed to finalize course");
    }

    // Refetch to get updated state
    const progressRes = await fetch(
      `/api/progress?userId=${userId}&courseId=${encodeURIComponent(courseId)}`,
    );
    const { progress } = await progressRes.json();
    return rowToProgress(progress);
  },

  async getTotalXPEarned(userId) {
    const res = await fetch(`/api/progress?userId=${userId}`);
    if (!res.ok) return 0;
    const { progressList } = await res.json();
    return (progressList ?? []).reduce(
      (sum: number, row: Record<string, unknown>) =>
        sum + ((row.xp_earned as number) ?? 0),
      0,
    );
  },

  async getCompletedCourseCount(userId) {
    const res = await fetch(`/api/progress?userId=${userId}`);
    if (!res.ok) return 0;
    const { progressList } = await res.json();
    return (progressList ?? []).filter(
      (row: Record<string, unknown>) => row.is_completed,
    ).length;
  },
};
