import type { Achievement } from "@superteam-lms/types";

export const ACHIEVEMENT_CATALOG = [
  // Progress
  {
    id: "first-steps",
    name: "First Steps",
    description: "Complete your first lesson",
    icon: "Footprints",
    category: "progress",
  },
  {
    id: "course-completer",
    name: "Course Completer",
    description: "Complete an entire course",
    icon: "GraduationCap",
    category: "progress",
  },
  {
    id: "speed-runner",
    name: "Speed Runner",
    description: "Complete a course in under 24 hours",
    icon: "Zap",
    category: "progress",
  },
  // Streaks
  {
    id: "week-warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    icon: "Flame",
    category: "streaks",
  },
  {
    id: "monthly-master",
    name: "Monthly Master",
    description: "Maintain a 30-day learning streak",
    icon: "CalendarCheck",
    category: "streaks",
  },
  {
    id: "consistency-king",
    name: "Consistency King",
    description: "Maintain a 100-day learning streak",
    icon: "Crown",
    category: "streaks",
  },
  // Skills
  {
    id: "rust-rookie",
    name: "Rust Rookie",
    description: "Complete your first Rust lesson",
    icon: "Code",
    category: "skills",
  },
  {
    id: "anchor-expert",
    name: "Anchor Expert",
    description: "Complete the Anchor framework course",
    icon: "Anchor",
    category: "skills",
  },
  {
    id: "full-stack-solana",
    name: "Full Stack Solana",
    description: "Complete all learning tracks",
    icon: "Layers",
    category: "skills",
  },
  // Community
  {
    id: "helper",
    name: "Helper",
    description: "Help another learner in the community",
    icon: "HandHelping",
    category: "community",
  },
  {
    id: "first-comment",
    name: "First Comment",
    description: "Leave your first comment on a lesson",
    icon: "MessageSquare",
    category: "community",
  },
  {
    id: "top-contributor",
    name: "Top Contributor",
    description: "Be a top contributor in the community",
    icon: "Star",
    category: "community",
  },
  // Special
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "Be among the first 100 users",
    icon: "Rocket",
    category: "special",
  },
  {
    id: "bug-hunter",
    name: "Bug Hunter",
    description: "Report a valid bug in the platform",
    icon: "Bug",
    category: "special",
  },
  {
    id: "perfect-score",
    name: "Perfect Score",
    description: "Pass all tests on the first try",
    icon: "Target",
    category: "special",
  },
] as const;

export type AchievementId = (typeof ACHIEVEMENT_CATALOG)[number]["id"];

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  category: Achievement["category"];
}

export function isAchievementId(id: string): id is AchievementId {
  return ACHIEVEMENT_CATALOG.some((a) => a.id === id);
}

export const ACHIEVEMENT_CATEGORIES = [
  "progress",
  "streaks",
  "skills",
  "community",
  "special",
] as const;

export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

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

export function checkNewAchievements(
  state: UserState,
  alreadyUnlocked: string[]
): AchievementDefinition[] {
  const newlyUnlocked: AchievementDefinition[] = [];
  const unlocked = new Set(alreadyUnlocked);

  const checks: Partial<Record<AchievementId, () => boolean>> = {
    "first-steps": () => state.completedLessons >= 1,
    "course-completer": () => state.completedCourses >= 1,
    "speed-runner": () =>
      state.courseCompletionTimeHours !== null &&
      state.courseCompletionTimeHours < 24,
    "week-warrior": () => state.currentStreak >= 7,
    "monthly-master": () => state.currentStreak >= 30,
    "consistency-king": () => state.currentStreak >= 100,
    "rust-rookie": () => state.hasCompletedRustLesson,
    "anchor-expert": () => state.hasCompletedAnchorCourse,
    "full-stack-solana": () => state.hasCompletedAllTracks,
    "early-adopter": () => state.userNumber <= 100,
    "perfect-score": () => state.allTestsPassedFirstTry,
  };

  for (const def of ACHIEVEMENT_CATALOG) {
    if (unlocked.has(def.id)) continue;
    const check = checks[def.id];
    if (check && check()) {
      newlyUnlocked.push(def);
    }
  }

  return newlyUnlocked;
}

export function getAchievementById(
  id: string
): AchievementDefinition | undefined {
  return ACHIEVEMENT_CATALOG.find((a) => a.id === id);
}

export function getAchievementsByCategory(
  category: AchievementCategory
): AchievementDefinition[] {
  return ACHIEVEMENT_CATALOG.filter((a) => a.category === category);
}
