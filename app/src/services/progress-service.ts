import type { CourseProgress } from "@/types";

export interface ProgressService {
  getProgress(userId: string, courseId: string): Promise<CourseProgress | null>;
  getAllProgress(userId: string): Promise<CourseProgress[]>;
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
    xp: number,
  ): Promise<CourseProgress>;
  finalizeCourse(userId: string, courseId: string): Promise<CourseProgress>;
  getTotalXPEarned(userId: string): Promise<number>;
  getCompletedCourseCount(userId: string): Promise<number>;
}
