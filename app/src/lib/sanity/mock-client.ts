import {
  seedAllTracks,
  seedAllCoursesRaw,
  seedAllCourseDetails,
  seedLessons,
  seedAchievements,
  seedDailyChallenge,
} from '@/lib/sanity/seed-data';
import { getAllChallenges, getChallengesByCategory, getChallengeById } from '@/lib/challenges';
import type { ChallengeCategory } from '@/lib/challenges';

/**
 * Simulates network latency so loading/skeleton states remain visible
 * during local development without a real Sanity backend.
 */
function simulateDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * 100) + 100; // 100-200ms
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Route a GROQ query string to the appropriate seed data.
 *
 * We match on unique substrings that appear in each query defined in
 * `queries.ts`. The order of checks matters: more specific patterns
 * (e.g. `courseId == $courseId`) are tested before broader ones
 * (e.g. `_type == "course"`).
 */
function resolveQuery<T>(
  query: string,
  params?: Record<string, unknown>,
): T {
  // ── Lesson ────────────────────────────────────────────────────────
  // lessonByCourseAndIndexQuery: `_type == "lesson"`
  if (query.includes('_type == "lesson"')) {
    const lessonIndex = params?.lessonIndex as number | undefined;

    if (lessonIndex !== undefined) {
      const lesson = seedLessons.find((l) => l.lessonIndex === lessonIndex);
      return (lesson ?? null) as T;
    }

    return null as T;
  }

  // ── Single course by ID ───────────────────────────────────────────
  // courseByIdQuery: `courseId == $courseId` (checked before generic course)
  if (
    query.includes('_type == "course"') &&
    query.includes('courseId == $courseId')
  ) {
    const courseId = params?.courseId as string | undefined;

    if (courseId && seedAllCourseDetails[courseId]) {
      return seedAllCourseDetails[courseId] as T;
    }

    return null as T;
  }

  // ── Courses by track ──────────────────────────────────────────────
  // coursesByTrackQuery: `track->trackId == $trackId`
  if (
    query.includes('_type == "course"') &&
    query.includes('track->trackId == $trackId')
  ) {
    const trackId = params?.trackId as string | undefined;

    if (trackId) {
      const filtered = seedAllCoursesRaw.filter((c) => c.track.trackId === trackId);
      return filtered as T;
    }

    return [] as T;
  }

  // ── All / featured courses ────────────────────────────────────────
  // allCoursesQuery & featuredCoursesQuery: `_type == "course"` (no extra filters)
  if (query.includes('_type == "course"')) {
    return seedAllCoursesRaw as T;
  }

  // ── Tracks ────────────────────────────────────────────────────────
  if (query.includes('_type == "track"')) {
    return seedAllTracks as T;
  }

  // ── Achievements ──────────────────────────────────────────────────
  if (query.includes('_type == "achievement"')) {
    return seedAchievements as T;
  }

  // ── Daily challenge ───────────────────────────────────────────────
  if (query.includes('_type == "dailyChallenge"')) {
    return seedDailyChallenge as T;
  }

  // ── Coding challenges ───────────────────────────────────────────
  if (query.includes('_type == "challenge"')) {
    if (query.includes('challengeId == $challengeId')) {
      const challengeId = params?.challengeId as string | undefined;
      return (challengeId ? getChallengeById(challengeId) ?? null : null) as T;
    }
    if (query.includes('category == $category')) {
      const category = params?.category as ChallengeCategory | undefined;
      return (category ? getChallengesByCategory(category) : getAllChallenges()) as T;
    }
    return getAllChallenges() as T;
  }

  // ── Fallback ──────────────────────────────────────────────────────
  console.warn('[mock-client] Unmatched GROQ query — returning null:', query);
  return null as T;
}

/**
 * Drop-in replacement for the Sanity client's `fetch` method.
 * Routes queries to seed data so the app works without Sanity credentials.
 */
export const mockClient: {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>;
} = {
  async fetch<T>(
    query: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    await simulateDelay();
    return resolveQuery<T>(query, params);
  },
};
