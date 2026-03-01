import { useState, useEffect } from "react";
import { Course, Lesson } from "@/types";

export interface LessonAccess {
  canAccess: boolean;
  isLocked: boolean;
  isPreview: boolean;
  reason?: string;
}

export function useLessonAccess(
  course: Course | null,
  lessonId: string,
  userId: string | null,
  isEnrolled: boolean
): LessonAccess {
  const [access, setAccess] = useState<LessonAccess>({
    canAccess: false,
    isLocked: true,
    isPreview: false,
  });

  useEffect(() => {
    if (!course) return;

    // Get all lessons in order
    const allLessons = course.modules.flatMap((module) => module.lessons);
    const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);

    if (lessonIndex === -1) return;

    // First 2 lessons are always free preview
    const isPreviewLesson = lessonIndex < 2;

    // If user is enrolled, they can access all lessons
    if (isEnrolled) {
      setAccess({
        canAccess: true,
        isLocked: false,
        isPreview: false,
      });
      return;
    }

    // If not enrolled, only preview lessons are accessible
    if (isPreviewLesson) {
      setAccess({
        canAccess: true,
        isLocked: false,
        isPreview: true,
      });
    } else {
      setAccess({
        canAccess: false,
        isLocked: true,
        isPreview: false,
        reason: "Enroll in this course to unlock all lessons",
      });
    }
  }, [course, lessonId, userId, isEnrolled]);

  return access;
}

// Helper to get lesson number in the overall course
export function getLessonNumber(course: Course, lessonId: string): number {
  const allLessons = course.modules.flatMap((module) => module.lessons);
  const index = allLessons.findIndex((l) => l.id === lessonId);
  return index + 1; // 1-based index
}

// Helper to check if a lesson is a preview
export function isPreviewLesson(course: Course, lessonId: string): boolean {
  const lessonNumber = getLessonNumber(course, lessonId);
  return lessonNumber <= 2;
}
