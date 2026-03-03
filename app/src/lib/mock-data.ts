import type { Course, Achievement } from "@/types";
import { MOCK_COURSES } from "./mock-courses";
export { MOCK_COURSES };

// Achievements are seeded from prisma/seed-data/achievements.ts and served via API.
export const MOCK_ACHIEVEMENTS: Achievement[] = [];

export function getCourseBySlug(slug: string): Course | undefined {
  return MOCK_COURSES.find((c) => c.slug === slug);
}

export function getCoursesByTrack(trackId: number): Course[] {
  return MOCK_COURSES.filter((c) => c.trackId === trackId);
}

export function getCoursesByDifficulty(
  difficulty: Course["difficulty"],
): Course[] {
  return MOCK_COURSES.filter((c) => c.difficulty === difficulty);
}
