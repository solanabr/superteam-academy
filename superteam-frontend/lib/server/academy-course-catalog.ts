import "server-only";

import { getAllCourses } from "@/lib/server/admin-store";

export type CatalogCourseMeta = {
  slug: string;
  lessonsCount: number;
  trackId: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
};

// XP rewards per difficulty tier
const XP_REWARDS = {
  Beginner: { lesson: 10, challenge: 25, courseComplete: 500 },
  Intermediate: { lesson: 30, challenge: 60, courseComplete: 1000 },
  Advanced: { lesson: 50, challenge: 100, courseComplete: 2000 },
} as const;

export const DAILY_STREAK_BONUS = 10;
export const FIRST_COMPLETION_OF_DAY_BONUS = 25;

export function getXpRewards(
  difficulty: "Beginner" | "Intermediate" | "Advanced",
) {
  return XP_REWARDS[difficulty];
}

export async function getCatalogCourseMeta(
  slug: string,
): Promise<CatalogCourseMeta | null> {
  const courses = await getAllCourses();
  const index = courses.findIndex((item) => item.slug === slug);
  if (index < 0) return null;
  const course = courses[index];
  const lessonsCount = course.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0,
  );
  return {
    slug,
    lessonsCount,
    trackId: index + 1,
    difficulty: course.difficulty,
  };
}
