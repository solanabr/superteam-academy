export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface UserState {
  completedLessons: number;
  completedCourses: number;
  currentStreak: number;
  hasCompletedRustLesson: boolean;
  hasCompletedAnchorCourse: boolean;
  hasCompletedAllTracks: boolean;
  courseCompletionTimeHours: number | null;
  allTestsPassedFirstTry: boolean;
  userNumber: number;
}

/**
 * Programmatic unlock conditions keyed by achievement ID.
 * IDs must match the naming convention used in Sanity (Sanity _id minus the "achievement-" prefix).
 * Metadata (name, description, icon, category) lives in Sanity — only the logic lives here.
 */
const UNLOCK_CHECKS: Record<string, (state: UserState) => boolean> = {
  "achievement-first-steps": (s) => s.completedLessons >= 1,
  "achievement-course-completer": (s) => s.completedCourses >= 1,
  "achievement-speed-runner": (s) =>
    s.courseCompletionTimeHours !== null && s.courseCompletionTimeHours < 24,
  "achievement-week-warrior": (s) => s.currentStreak >= 7,
  "achievement-monthly-master": (s) => s.currentStreak >= 30,
  "achievement-consistency-king": (s) => s.currentStreak >= 100,
  "achievement-rust-rookie": (s) => s.hasCompletedRustLesson,
  "achievement-anchor-expert": (s) => s.hasCompletedAnchorCourse,
  "achievement-full-stack-solana": (s) => s.hasCompletedAllTracks,
  "achievement-early-adopter": (s) => s.userNumber <= 100,
  "achievement-perfect-score": (s) => s.allTestsPassedFirstTry,
};

/**
 * Returns achievements the user has newly earned.
 * Only checks achievements in `deployedAchievements` — the subset fetched from Sanity
 * that have an on-chain PDA. Achievements without a check entry are silently skipped
 * (e.g. manual / admin-granted achievements like "bug-hunter").
 */
export function checkNewAchievements(
  deployedAchievements: AchievementDefinition[],
  state: UserState,
  alreadyUnlocked: string[]
): AchievementDefinition[] {
  const unlocked = new Set(alreadyUnlocked);
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const def of deployedAchievements) {
    if (unlocked.has(def.id)) continue;
    const check = UNLOCK_CHECKS[def.id];
    if (check && check(state)) {
      newlyUnlocked.push(def);
    }
  }

  return newlyUnlocked;
}
