import { Course, LeaderboardEntry, Lesson, LearningProgress } from "@/domain/models";
import { getLevelFromXp } from "./utils";

export function getLessonXp(params: { xpReward: number; totalLessons: number; lessonType: Lesson["type"] }) {
  const base = Math.max(1, Math.round(params.xpReward / Math.max(params.totalLessons, 1)));
  const lessonType = params.lessonType;
  return lessonType === "challenge" ? base + 20 : base;
}

export function getTotalXpFromProgress(courses: Course[], progressByCourse: Record<string, LearningProgress | null>) {
  return courses.reduce((sum, course) => {
    const completed = progressByCourse[course.id]?.completedLessonIds ?? [];
    return (
      sum +
      completed.reduce((courseSum, lessonId) => {
        const lesson = course.lessons.find((item) => item.id === lessonId);
        if (!lesson) return courseSum;
        return courseSum + getLessonXp({ xpReward: course.xpReward, totalLessons: course.lessons.length, lessonType: lesson.type });
      }, 0)
    );
  }, 0);
}

export function rankEntries(entries: LeaderboardEntry[]) {
  return [...entries]
    .sort((a, b) => b.xp - a.xp)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      level: entry.level || getLevelFromXp(entry.xp),
    }));
}
