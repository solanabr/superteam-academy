import type { EnrollmentService } from "../enrollment-service";
import type { Enrollment } from "@/types";

async function apiGet(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const supabaseEnrollmentService: EnrollmentService = {
  async enroll(userId, courseId, totalLessons?: number) {
    const now = Date.now();

    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId, totalLessons }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Enrollment failed" }));
      throw new Error(err.error || err.details || "Enrollment failed");
    }

    return {
      courseId,
      learner: userId,
      lessonFlags: [],
      enrolledAt: now,
      completedAt: null,
      credentialAsset: null,
    } satisfies Enrollment;
  },

  async getEnrollment(userId, courseId) {
    const { progress } = await apiGet(
      `/api/progress?userId=${userId}&courseId=${encodeURIComponent(courseId)}`,
    );

    if (!progress) return null;

    return {
      courseId: progress.course_id,
      learner: userId,
      lessonFlags: [],
      enrolledAt: new Date(progress.enrolled_at).getTime(),
      completedAt: progress.completed_at
        ? new Date(progress.completed_at).getTime()
        : null,
      credentialAsset: null,
    } satisfies Enrollment;
  },

  async getEnrollments(userId) {
    const { progressList } = await apiGet(`/api/progress?userId=${userId}`);

    return (progressList ?? []).map(
      (row: Record<string, unknown>) =>
        ({
          courseId: row.course_id as string,
          learner: userId,
          lessonFlags: [],
          enrolledAt: new Date(row.enrolled_at as string).getTime(),
          completedAt: row.completed_at
            ? new Date(row.completed_at as string).getTime()
            : null,
          credentialAsset: null,
        }) satisfies Enrollment,
    );
  },

  async isEnrolled(userId, courseId) {
    const { progress } = await apiGet(
      `/api/progress?userId=${userId}&courseId=${encodeURIComponent(courseId)}`,
    );
    return !!progress;
  },

  async closeEnrollment() {
    // No-op for now
  },
};
