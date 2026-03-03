import type { Course } from "@/types";
import { TRACKS, DIFFICULTIES } from "@/lib/constants";

interface OnboardingPreferences {
  experience?: string;
  interests?: string[];
  goal?: string;
  pace?: string;
}

/**
 * Scores and sorts courses by relevance to the user's onboarding preferences
 * and assessed skill level.
 *
 * Accepts an optional `tracks` map; falls back to the hardcoded TRACKS constant.
 */
export function getPersonalizedRecommendations(
  courses: Course[],
  opts: {
    skillLevel?: string | null;
    preferences?: OnboardingPreferences | null;
    enrolledIds?: string[];
    tracks?: Record<number, { name: string }>;
    difficultyOrder?: string[];
  },
): Course[] {
  const {
    skillLevel,
    preferences,
    enrolledIds = [],
    tracks = TRACKS,
    difficultyOrder = DIFFICULTIES.map((d) => d.value),
  } = opts;

  // Filter out already-enrolled courses
  const available = courses.filter(
    (c) => !enrolledIds.includes(c.slug) && !enrolledIds.includes(c.id),
  );

  if (!skillLevel && !preferences) {
    return available.slice(0, 3);
  }

  const interests = preferences?.interests ?? [];
  const goal = preferences?.goal;

  const scored = available.map((course) => {
    let score = 0;

    // Skill level ↔ difficulty match (5 for exact, 2 for adjacent)
    if (skillLevel) {
      const skillIdx = difficultyOrder.indexOf(skillLevel);
      const courseIdx = difficultyOrder.indexOf(course.difficulty);
      if (course.difficulty === skillLevel) {
        score += 5;
      } else if (
        skillIdx >= 0 &&
        courseIdx >= 0 &&
        Math.abs(skillIdx - courseIdx) === 1
      ) {
        score += 2;
      }
    }

    // Interest ↔ track match (4 points)
    const track = tracks[course.trackId];
    if (track && interests.includes(track.name)) {
      score += 4;
    }

    // Goal-based boost (2 points)
    if (goal === "first-program" && course.difficulty === "beginner")
      score += 2;
    if (goal === "job" && course.difficulty !== "beginner") score += 2;
    if (goal === "contribute" && track?.name === "anchor") score += 2;
    if (goal === "project" && course.difficulty === "intermediate") score += 2;

    return { course, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.course);
}
