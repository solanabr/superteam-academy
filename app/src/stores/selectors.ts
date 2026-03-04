import { useProgressStore } from "./progress-store";

// Atomic selectors — each subscribes only to the slice it needs,
// preventing re-renders when unrelated store slices change.

export const useXp = () => useProgressStore((s) => s.xp);

export const useStreakDays = () => useProgressStore((s) => s.streakDays);

export const useLastActivityDate = () =>
  useProgressStore((s) => s.lastActivityDate);

export const useStreakMilestonesReached = () =>
  useProgressStore((s) => s.streakMilestonesReached);

export const useIsLessonComplete = (courseId: string, lessonIndex: number) =>
  useProgressStore(
    (s) => s.completedLessons[courseId]?.has(lessonIndex) ?? false
  );

export const useCourseProgress = (courseId: string, totalLessons: number) =>
  useProgressStore((s) => {
    const completed = s.completedLessons[courseId]?.size ?? 0;
    return totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
  });

export const useCompletedLessonCount = (courseId: string) =>
  useProgressStore((s) => s.completedLessons[courseId]?.size ?? 0);
