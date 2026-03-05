/**
 * Gamification Service
 *
 * Connects lesson/course/challenge completion to:
 * - XP awards (localStorage, on-chain later)
 * - Streak tracking (consecutive days with activity)
 * - Achievement unlocking
 * - Activity recording
 */

import { learningProgressService } from "./learning-progress";

const STORAGE_PREFIX = "st-academy";

function get<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : def;
  } catch {
    return def;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// XP
// ---------------------------------------------------------------------------

function xpKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}:xp`;
}

export function getLocalXp(userId: string): number {
  return get<number>(xpKey(userId), 0);
}

export function awardXp(userId: string, amount: number): number {
  const current = getLocalXp(userId);
  const next = current + amount;
  set(xpKey(userId), next);
  return next;
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export interface StreakState {
  current: number;
  longest: number;
  lastActivityDate: string | null;
  freezeAvailable: boolean;
  freezeUsed: boolean;
  /** ISO dates of all active days */
  activeDates: string[];
}

function streakKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}:streak`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getStreak(userId: string): StreakState {
  return get<StreakState>(streakKey(userId), {
    current: 0,
    longest: 0,
    lastActivityDate: null,
    freezeAvailable: true,
    freezeUsed: false,
    activeDates: [],
  });
}

/** Record activity for today and update streak. Returns updated streak. */
export function updateStreak(userId: string): StreakState {
  const state = getStreak(userId);
  const today = toDateStr(new Date());

  // Already recorded today
  if (state.lastActivityDate === today) return state;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  let { current } = state;

  if (state.lastActivityDate === yesterdayStr) {
    // Consecutive day
    current += 1;
  } else if (
    state.lastActivityDate !== null &&
    state.lastActivityDate !== today
  ) {
    // Missed day(s)
    const lastDate = new Date(state.lastActivityDate);
    const daysBetween = Math.floor(
      (new Date().getTime() - lastDate.getTime()) / 86400000,
    );

    if (daysBetween === 2 && state.freezeAvailable && !state.freezeUsed) {
      // Streak freeze: missed exactly 1 day, freeze available
      current += 1;
      state.freezeUsed = true;
    } else {
      // Streak broken
      current = 1;
      // Reset freeze for new streak
      state.freezeUsed = false;
    }
  } else {
    // First activity ever
    current = 1;
  }

  const longest = Math.max(state.longest, current);
  const activeDates = state.activeDates.includes(today)
    ? state.activeDates
    : [...state.activeDates, today];

  const updated: StreakState = {
    current,
    longest,
    lastActivityDate: today,
    freezeAvailable: !state.freezeUsed,
    freezeUsed: state.freezeUsed,
    activeDates,
  };

  set(streakKey(userId), updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export type AchievementId =
  // Progress
  | "first_steps"
  | "course_completer"
  | "speed_runner"
  // Streaks
  | "week_warrior"
  | "monthly_master"
  | "consistency_king"
  // Skills
  | "rust_rookie"
  | "anchor_expert"
  | "full_stack_solana"
  // Community
  | "early_adopter"
  | "helper"
  // Special
  | "bug_hunter"
  | "perfect_score";

export interface AchievementDef {
  id: AchievementId;
  /** i18n key in 'achievements' namespace */
  nameKey: string;
  descKey: string;
  icon: string; // lucide icon name
  xpReward: number;
  /** Category for grouping */
  category: "progress" | "streaks" | "skills" | "community" | "special";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Progress
  {
    id: "first_steps",
    nameKey: "firstStepsName",
    descKey: "firstStepsDesc",
    icon: "Footprints",
    xpReward: 25,
    category: "progress",
  },
  {
    id: "course_completer",
    nameKey: "courseCompleterName",
    descKey: "courseCompleterDesc",
    icon: "GraduationCap",
    xpReward: 200,
    category: "progress",
  },
  {
    id: "speed_runner",
    nameKey: "speedRunnerName",
    descKey: "speedRunnerDesc",
    icon: "Zap",
    xpReward: 100,
    category: "progress",
  },
  // Streaks
  {
    id: "week_warrior",
    nameKey: "weekWarriorName",
    descKey: "weekWarriorDesc",
    icon: "Flame",
    xpReward: 50,
    category: "streaks",
  },
  {
    id: "monthly_master",
    nameKey: "monthlyMasterName",
    descKey: "monthlyMasterDesc",
    icon: "Flame",
    xpReward: 150,
    category: "streaks",
  },
  {
    id: "consistency_king",
    nameKey: "consistencyKingName",
    descKey: "consistencyKingDesc",
    icon: "Crown",
    xpReward: 500,
    category: "streaks",
  },
  // Skills
  {
    id: "rust_rookie",
    nameKey: "rustRookieName",
    descKey: "rustRookieDesc",
    icon: "Code",
    xpReward: 50,
    category: "skills",
  },
  {
    id: "anchor_expert",
    nameKey: "anchorExpertName",
    descKey: "anchorExpertDesc",
    icon: "Anchor",
    xpReward: 100,
    category: "skills",
  },
  {
    id: "full_stack_solana",
    nameKey: "fullStackSolanaName",
    descKey: "fullStackSolanaDesc",
    icon: "Layers",
    xpReward: 300,
    category: "skills",
  },
  // Community
  {
    id: "early_adopter",
    nameKey: "earlyAdopterName",
    descKey: "earlyAdopterDesc",
    icon: "Sparkles",
    xpReward: 50,
    category: "community",
  },
  {
    id: "helper",
    nameKey: "helperName",
    descKey: "helperDesc",
    icon: "Heart",
    xpReward: 25,
    category: "community",
  },
  // Special
  {
    id: "bug_hunter",
    nameKey: "bugHunterName",
    descKey: "bugHunterDesc",
    icon: "Bug",
    xpReward: 100,
    category: "special",
  },
  {
    id: "perfect_score",
    nameKey: "perfectScoreName",
    descKey: "perfectScoreDesc",
    icon: "Target",
    xpReward: 150,
    category: "special",
  },
];

function achievementsKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}:achievements`;
}

export function getUnlockedAchievements(userId: string): AchievementId[] {
  return get<AchievementId[]>(achievementsKey(userId), []);
}

function unlockAchievement(userId: string, id: AchievementId): boolean {
  const unlocked = getUnlockedAchievements(userId);
  if (unlocked.includes(id)) return false;
  unlocked.push(id);
  set(achievementsKey(userId), unlocked);

  // Award XP for the achievement
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (def && def.xpReward > 0) {
    awardXp(userId, def.xpReward);
  }
  return true;
}

/** Check and unlock achievements based on current state. Returns newly unlocked IDs. */
export function checkAchievements(userId: string): AchievementId[] {
  const newly: AchievementId[] = [];
  const streak = getStreak(userId);
  const xp = getLocalXp(userId);
  const completedLessons = getCompletedLessonCount(userId);
  const completedCourses = getCompletedCourseCount(userId);

  // Progress achievements
  if (completedLessons >= 1 && unlockAchievement(userId, "first_steps"))
    newly.push("first_steps");
  if (completedCourses >= 1 && unlockAchievement(userId, "course_completer"))
    newly.push("course_completer");
  if (completedLessons >= 5 && unlockAchievement(userId, "speed_runner"))
    newly.push("speed_runner");

  // Streak achievements
  if (streak.current >= 7 && unlockAchievement(userId, "week_warrior"))
    newly.push("week_warrior");
  if (streak.current >= 30 && unlockAchievement(userId, "monthly_master"))
    newly.push("monthly_master");
  if (streak.current >= 100 && unlockAchievement(userId, "consistency_king"))
    newly.push("consistency_king");

  // Skills — based on lessons completed in specific tracks
  const rustLessons = getTrackLessonCount(userId, "rust-para-solana");
  const anchorLessons = getTrackLessonCount(userId, "anchor-framework");
  if (rustLessons >= 1 && unlockAchievement(userId, "rust_rookie"))
    newly.push("rust_rookie");
  if (anchorLessons >= 3 && unlockAchievement(userId, "anchor_expert"))
    newly.push("anchor_expert");
  if (completedCourses >= 3 && unlockAchievement(userId, "full_stack_solana"))
    newly.push("full_stack_solana");

  // Community
  if (xp >= 1 && unlockAchievement(userId, "early_adopter"))
    newly.push("early_adopter");

  // Special — perfect_score: answered exercise correctly first try (tracked separately)
  const perfectScores = get<number>(
    `${STORAGE_PREFIX}:${userId}:perfect-scores`,
    0,
  );
  if (perfectScores >= 3 && unlockAchievement(userId, "perfect_score"))
    newly.push("perfect_score");

  return newly;
}

// ---------------------------------------------------------------------------
// Helpers — count completed lessons/courses from localStorage
// ---------------------------------------------------------------------------

function getCompletedLessonCount(userId: string): number {
  if (typeof window === "undefined") return 0;
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key?.startsWith("st-academy:lesson:") &&
      localStorage.getItem(key) === "completed"
    ) {
      count++;
    }
  }
  return count;
}

function getCompletedCourseCount(userId: string): number {
  // A course is "completed" if we recorded a course_completed activity
  const activities = get<Array<{ type: string }>>(
    `${STORAGE_PREFIX}:${userId}:activities`,
    [],
  );
  return activities.filter((a) => a.type === "course_completed").length;
}

function getTrackLessonCount(_userId: string, courseSlug: string): number {
  if (typeof window === "undefined") return 0;
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key?.startsWith(`st-academy:lesson:${courseSlug}:`) &&
      localStorage.getItem(key) === "completed"
    ) {
      count++;
    }
  }
  return count;
}

/** Increment perfect score counter */
export function recordPerfectScore(userId: string): void {
  const key = `${STORAGE_PREFIX}:${userId}:perfect-scores`;
  const current = get<number>(key, 0);
  set(key, current + 1);
}

// ---------------------------------------------------------------------------
// Daily bonus tracking
// ---------------------------------------------------------------------------

function dailyBonusKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}:daily-bonus`;
}

/** Award daily bonus XP if first activity of the day. Returns XP awarded (0 if already claimed). */
export function claimDailyBonus(userId: string): number {
  const today = toDateStr(new Date());
  const lastClaim = get<string>(dailyBonusKey(userId), "");
  if (lastClaim === today) return 0;
  set(dailyBonusKey(userId), today);

  // First completion of the day: 25 XP
  awardXp(userId, 25);
  return 25;
}

/** Award streak bonus XP. Returns XP awarded. */
export function claimStreakBonus(userId: string): number {
  const streak = getStreak(userId);
  if (streak.current <= 0) return 0;

  const today = toDateStr(new Date());
  const streakBonusKey = `${STORAGE_PREFIX}:${userId}:streak-bonus`;
  const lastClaim = get<string>(streakBonusKey, "");
  if (lastClaim === today) return 0;
  set(streakBonusKey, today);

  // Daily streak bonus: 10 XP
  awardXp(userId, 10);

  // Milestone bonuses
  let milestoneXp = 0;
  if (streak.current === 7) milestoneXp = 50;
  else if (streak.current === 30) milestoneXp = 150;
  else if (streak.current === 100) milestoneXp = 500;

  if (milestoneXp > 0) awardXp(userId, milestoneXp);

  return 10 + milestoneXp;
}

// ---------------------------------------------------------------------------
// Main entry point: call on lesson/challenge completion
// ---------------------------------------------------------------------------

export interface CompletionResult {
  xpAwarded: number;
  dailyBonus: number;
  streakBonus: number;
  newStreak: StreakState;
  newAchievements: AchievementId[];
  totalXp: number;
}

export async function onLessonCompleted(
  userId: string,
  courseSlug: string,
  lessonLabel: string,
  lessonSlug: string,
  xpReward: number,
  isChallenge: boolean,
): Promise<CompletionResult> {
  // 1. Award lesson XP
  awardXp(userId, xpReward);

  // 2. Record activity
  await learningProgressService.recordActivity(userId, {
    type: isChallenge ? "challenge_completed" : "lesson_completed",
    xpGained: xpReward,
    label: lessonLabel,
    slug: `${courseSlug}/lessons/${lessonSlug}`,
    kind: "lesson",
  });

  // 3. Update streak
  const newStreak = updateStreak(userId);

  // 4. Daily bonus
  const dailyBonus = claimDailyBonus(userId);

  // 5. Streak bonus
  const streakBonus = claimStreakBonus(userId);

  // 6. Check achievements
  const newAchievements = checkAchievements(userId);

  const totalXp = getLocalXp(userId);

  return {
    xpAwarded: xpReward,
    dailyBonus,
    streakBonus,
    newStreak,
    newAchievements,
    totalXp,
  };
}

export async function onCourseStarted(
  userId: string,
  courseSlug: string,
  courseLabel: string,
): Promise<void> {
  await learningProgressService.recordActivity(userId, {
    type: "course_started",
    xpGained: 0,
    label: courseLabel,
    slug: courseSlug,
    kind: "course",
  });
}

/** Get all active dates for the streak calendar. */
export function getActiveDates(userId: string): Set<string> {
  const streak = getStreak(userId);
  const dates = new Set<string>();
  for (const iso of streak.activeDates) {
    const d = new Date(iso);
    dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return dates;
}
