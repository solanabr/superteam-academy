import type { LearningProgressService, Progress } from "./interfaces";
import type { Enrollment } from "@/types/user";
import { getAdminClient } from "@/lib/supabase/admin";
import { rowToEnrollment } from "@/lib/supabase/mappers";

// --- Mock Implementation ---

const MOCK_ENROLLMENTS: Enrollment[] = [];

class MockLearningProgressService implements LearningProgressService {
  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const enrollment = MOCK_ENROLLMENTS.find(
      (e) => e.userId === userId && e.courseId === courseId,
    );
    if (!enrollment) {
      return {
        courseId,
        completedLessons: [],
        totalLessons: 0,
        progressPct: 0,
        completedAt: null,
      };
    }
    return {
      courseId,
      completedLessons: flagsToIndices(enrollment.lessonFlags),
      totalLessons: enrollment.lessonFlags.length * 64,
      progressPct: enrollment.progressPct,
      completedAt: enrollment.completedAt,
    };
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void> {
    let enrollment = MOCK_ENROLLMENTS.find(
      (e) => e.userId === userId && e.courseId === courseId,
    );
    if (!enrollment) {
      await this.enroll(userId, courseId);
      enrollment = MOCK_ENROLLMENTS.find(
        (e) => e.userId === userId && e.courseId === courseId,
      );
    }
    if (enrollment) {
      const flagIndex = Math.floor(lessonIndex / 64);
      while (enrollment.lessonFlags.length <= flagIndex) {
        enrollment.lessonFlags.push(0);
      }
      enrollment.lessonFlags[flagIndex] |= 1 << (lessonIndex % 64);
    }
  }

  async getEnrollments(userId: string): Promise<Enrollment[]> {
    return MOCK_ENROLLMENTS.filter((e) => e.userId === userId);
  }

  async enroll(userId: string, courseId: string): Promise<void> {
    const existing = MOCK_ENROLLMENTS.find(
      (e) => e.userId === userId && e.courseId === courseId,
    );
    if (existing) return;
    MOCK_ENROLLMENTS.push({
      id: crypto.randomUUID(),
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      completedAt: null,
      progressPct: 0,
      lessonFlags: [0, 0, 0, 0],
    });
  }

  async unenroll(userId: string, courseId: string): Promise<void> {
    const idx = MOCK_ENROLLMENTS.findIndex(
      (e) => e.userId === userId && e.courseId === courseId,
    );
    if (idx !== -1) MOCK_ENROLLMENTS.splice(idx, 1);
  }
}

// --- Supabase Implementation ---

class SupabaseLearningProgressService implements LearningProgressService {
  private get db() {
    const client = getAdminClient();
    if (!client) throw new Error("Supabase admin client not configured");
    return client;
  }

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const { data, error } = await this.db
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (error || !data) {
      return {
        courseId,
        completedLessons: [],
        totalLessons: 0,
        progressPct: 0,
        completedAt: null,
      };
    }

    const flags: number[] = data.lesson_flags ?? [0, 0, 0, 0];
    return {
      courseId,
      completedLessons: flagsToIndices(flags),
      totalLessons: flags.length * 64,
      progressPct: data.progress_pct ?? 0,
      completedAt: data.completed_at ?? null,
    };
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void> {
    // Get current enrollment
    const { data: enrollment } = await this.db
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!enrollment) {
      await this.enroll(userId, courseId);
      return this.completeLesson(userId, courseId, lessonIndex);
    }

    const flags: number[] = [...(enrollment.lesson_flags ?? [0, 0, 0, 0])];
    const flagIndex = Math.floor(lessonIndex / 64);
    while (flags.length <= flagIndex) {
      flags.push(0);
    }
    flags[flagIndex] |= 1 << (lessonIndex % 64);

    const completedCount = flagsToIndices(flags).length;
    const totalLessons = flags.length * 64;
    const progressPct = totalLessons > 0
      ? Math.min(100, (completedCount / totalLessons) * 100)
      : 0;

    await this.db
      .from("enrollments")
      .update({
        lesson_flags: flags,
        progress_pct: progressPct,
      })
      .eq("user_id", userId)
      .eq("course_id", courseId);
  }

  async getEnrollments(userId: string): Promise<Enrollment[]> {
    const { data, error } = await this.db
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    if (error || !data) return [];
    return data.map(rowToEnrollment);
  }

  async enroll(userId: string, courseId: string): Promise<void> {
    const { error } = await this.db.from("enrollments").upsert(
      {
        user_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        progress_pct: 0,
        lesson_flags: [0, 0, 0, 0],
      },
      { onConflict: "user_id,course_id" },
    );

    if (error && error.code !== "23505") {
      throw error;
    }
  }

  async unenroll(userId: string, courseId: string): Promise<void> {
    await this.db
      .from("enrollments")
      .delete()
      .eq("user_id", userId)
      .eq("course_id", courseId);
  }
}

// --- Helpers ---

function flagsToIndices(flags: number[]): number[] {
  const indices: number[] = [];
  for (let i = 0; i < flags.length; i++) {
    for (let bit = 0; bit < 64; bit++) {
      if (flags[i] & (1 << bit)) {
        indices.push(i * 64 + bit);
      }
    }
  }
  return indices;
}

// --- Singleton with fallback ---

function createService(): LearningProgressService {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return new SupabaseLearningProgressService();
  }
  return new MockLearningProgressService();
}

export const learningProgressService: LearningProgressService = createService();
