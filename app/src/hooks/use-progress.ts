"use client";

import { useState, useCallback } from "react";

interface LessonProgress {
  completedLessons: Set<string>;
  totalLessons: number;
}

export function useProgress(courseId: string, totalLessons: number) {
  const [progress, setProgress] = useState<LessonProgress>({
    completedLessons: new Set(),
    totalLessons,
  });

  const completeLesson = useCallback((lessonId: string) => {
    setProgress((prev) => {
      const next = new Set(prev.completedLessons);
      next.add(lessonId);
      return { ...prev, completedLessons: next };
    });
  }, []);

  const isLessonComplete = useCallback(
    (lessonId: string) => progress.completedLessons.has(lessonId),
    [progress.completedLessons],
  );

  const progressPct =
    totalLessons > 0
      ? (progress.completedLessons.size / totalLessons) * 100
      : 0;

  const isComplete = progress.completedLessons.size >= totalLessons;

  return {
    completedCount: progress.completedLessons.size,
    totalLessons,
    progressPct,
    isComplete,
    completeLesson,
    isLessonComplete,
    courseId,
  };
}
