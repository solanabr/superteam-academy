import type { LearningProgressService, Progress } from "./interfaces";
import type { Enrollment } from "@/types/user";

const MOCK_ENROLLMENTS: Enrollment[] = [];

export class SupabaseLearningProgressService implements LearningProgressService {
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
    const completedLessons = this.flagsToIndices(enrollment.lessonFlags);
    return {
      courseId,
      completedLessons,
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

  private flagsToIndices(flags: number[]): number[] {
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
}

export const learningProgressService = new SupabaseLearningProgressService();
