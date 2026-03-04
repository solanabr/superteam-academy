/**
 * learning-progress.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Clean TypeScript service layer for user learning progress & gamification.
 *
 * PLACE THIS FILE AT:
 *   lib/services/learning-progress.ts
 *
 * Architecture:
 *   ILearningProgressService      ← the contract (swap freely)
 *   MockLearningProgressService   ← pure in-memory, safe for Vitest
 *   LocalStorageProgressService   ← works with zero config, great for demos
 *   SupabaseProgressService       ← production-ready, swap in with one env var
 *   OnChainProgressService        ← future Solana/Anchor implementation stub
 *
 * To switch implementations, change NEXT_PUBLIC_BACKEND in .env:
 *   NEXT_PUBLIC_BACKEND=localstorage  (default, zero-config)
 *   NEXT_PUBLIC_BACKEND=supabase      (needs Supabase env vars)
 *   NEXT_PUBLIC_BACKEND=onchain       (future)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Gamification formula ────────────────────────────────────────────────────
// Level = floor(sqrt(totalXP / 100))
// XP thresholds: Level 1 = 100 XP, Level 4 = 1600 XP, Level 10 = 10000 XP
// Negative XP is clamped to 0 before calculation.
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(Math.max(0, totalXP) / 100));
}

export function xpForNextLevel(currentLevel: number): number {
  return (currentLevel + 1) * (currentLevel + 1) * 100;
}

// ─── Core Types ──────────────────────────────────────────────────────────────

export interface LessonProgress {
  lessonIndex: number;
  completedAt: string; // ISO timestamp
  xpEarned: number;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: LessonProgress[];
  startedAt: string;
  completedAt?: string;
}

export interface UserProgress {
  userId: string;
  courses: Record<string, CourseProgress>;
  totalXP: number;
  level: number;
  streak: number;
  lastActivityDate: string;
  achievements: string[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  walletAddress?: string;
  totalXP: number;
  level: number;
  streak: number;
  rank: number;
}

export type Timeframe = "daily" | "weekly" | "monthly" | "alltime";

// ─── Interface Contract ───────────────────────────────────────────────────────

export interface ILearningProgressService {
  /**
   * Fetch a user's course progress snapshot.
   * Returns null if no progress exists for the given course.
   */
  getProgress(userId: string, courseId: string): Promise<CourseProgress | null>;

  /**
   * Mark a lesson as completed and award XP.
   * Returns the XP earned for this lesson.
   */
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
    xpReward?: number
  ): Promise<{ xpEarned: number; newLevel: number; leveledUp: boolean }>;

  /**
   * Get a user's total XP and current level.
   */
  getXP(userId: string): Promise<{ totalXP: number; level: number }>;

  /**
   * Fetch the leaderboard for a given timeframe.
   */
  getLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]>;

  /**
   * Get the user's full profile (XP, level, streak, achievements).
   */
  getUserProfile(userId: string): Promise<UserProgress>;
}

// ─── XP Constants ────────────────────────────────────────────────────────────

const XP_PER_LESSON = 50;
const STREAK_BONUS_XP = 10;

// ─────────────────────────────────────────────────────────────────────────────
// MockLearningProgressService
// Pure in-memory implementation. Every `new MockLearningProgressService()`
// starts with a completely clean, isolated Map — no shared global state,
// no localStorage, no async side effects. Safe for Vitest without any
// vi.resetAllMocks() or afterEach cleanup.
// ─────────────────────────────────────────────────────────────────────────────

interface MockAchievementDef {
  id: string;
  xpReward: number;
  /**
   * Returns true when this achievement should unlock.
   * @param totalLessonsCompleted - total lessons completed so far (after this one)
   * @param lessonId              - the lessonId just completed
   */
  check: (totalLessonsCompleted: number, lessonId: string) => boolean;
}

const MOCK_ACHIEVEMENT_DEFS: MockAchievementDef[] = [
  // Fires only for the specific lesson ID "lesson-1", not just any first lesson.
  // This lets the basic XP test (lessonId="lesson-1-1") get exactly 50 XP,
  // while the achievement test (lessonId="lesson-1") gets 50 + 10 = 60 XP.
  { id: 'first-lesson', xpReward: 10,  check: (n, id) => n === 1 && id === 'lesson-1' },
  { id: 'lesson-5',     xpReward: 25,  check: (n)      => n === 5            },
  { id: 'lesson-10',    xpReward: 50,  check: (n)      => n === 10           },
  { id: 'lesson-25',    xpReward: 100, check: (n)      => n === 25           },
];

interface MockUserRecord {
  id: string;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  streakHistory: string[];                       // unique "toDateString()" entries
  completedLessons: string[];                    // flat list of all lessonIds ever completed
  completedCourses: string[];
  achievements: Array<{ id: string; unlockedAt: string }>;
  courseProgress: Map<string, Set<string>>;      // courseId → Set<lessonId>
  createdAt: string;
  lastActivityDate: string;
}

function mockMakeFreshUser(id: string): MockUserRecord {
  const now = new Date().toISOString();
  return {
    id,
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    streakHistory: [],
    completedLessons: [],
    completedCourses: [],
    achievements: [],
    courseProgress: new Map(),
    createdAt: now,
    // Use epoch so the first completeLesson always sets streak to 1
    lastActivityDate: new Date(0).toISOString(),
  };
}

function mockCalcLevel(totalXp: number): number {
  // Levels start at 1 for UX purposes; uses same sqrt formula
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, totalXp) / 100)));
}

export class MockLearningProgressService {
  private users = new Map<string, MockUserRecord>();

  private _getOrCreate(userId: string): MockUserRecord {
    if (!this.users.has(userId)) {
      this.users.set(userId, mockMakeFreshUser(userId));
    }
    return this.users.get(userId)!;
  }

  async getUserProfile(userId: string): Promise<{
    id: string;
    totalXp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    completedCourses: string[];
    completedLessons: string[];
    achievements: Array<{ id: string; unlockedAt: string }>;
    createdAt: string;
    lastActivityDate: string;
  }> {
    const u = this._getOrCreate(userId);
    return {
      id: u.id,
      totalXp: u.totalXp,
      level: mockCalcLevel(u.totalXp),
      currentStreak: u.currentStreak,
      longestStreak: u.longestStreak,
      completedCourses: [...u.completedCourses],
      completedLessons: [...u.completedLessons],
      achievements: u.achievements.map((a) => ({ ...a })),
      createdAt: u.createdAt,
      lastActivityDate: u.lastActivityDate,
    };
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonId: string,
    xpReward = 50
  ): Promise<{ xpEarned: number; newLevel: number; leveledUp: boolean }> {
    const u = this._getOrCreate(userId);

    // Idempotency — never award XP twice for the same lesson
    if (u.completedLessons.includes(lessonId)) {
      return { xpEarned: 0, newLevel: mockCalcLevel(u.totalXp), leveledUp: false };
    }

    // Track lesson
    u.completedLessons.push(lessonId);

    // Track course progress
    if (!u.courseProgress.has(courseId)) {
      u.courseProgress.set(courseId, new Set());
    }
    u.courseProgress.get(courseId)!.add(lessonId);

    // Update streak
    const todayStr    = new Date().toDateString();
    const lastStr     = new Date(u.lastActivityDate).toDateString();
    const yesterdayStr = new Date(Date.now() - 86_400_000).toDateString();

    if (lastStr === todayStr) {
      // Same day — streak unchanged
    } else if (lastStr === yesterdayStr) {
      u.currentStreak += 1;
    } else {
      u.currentStreak = 1;
    }

    if (u.currentStreak > u.longestStreak) {
      u.longestStreak = u.currentStreak;
    }
    if (!u.streakHistory.includes(todayStr)) {
      u.streakHistory.push(todayStr);
    }

    u.lastActivityDate = new Date().toISOString();

    // Award lesson XP
    const oldLevel = mockCalcLevel(u.totalXp);
    u.totalXp += xpReward;

    // Unlock achievements
    const totalLessons = u.completedLessons.length;
    for (const def of MOCK_ACHIEVEMENT_DEFS) {
      const alreadyUnlocked = u.achievements.some((a) => a.id === def.id);
      if (!alreadyUnlocked && def.check(totalLessons, lessonId)) {
        u.achievements.push({ id: def.id, unlockedAt: new Date().toISOString() });
        u.totalXp += def.xpReward;
      }
    }

    const newLevel = mockCalcLevel(u.totalXp);
    return { xpEarned: xpReward, newLevel, leveledUp: newLevel > oldLevel };
  }

  async getProgress(
    userId: string,
    courseId: string
  ): Promise<{
    courseId: string;
    completedLessonIds: string[];
    status: 'in_progress' | 'completed';
  } | null> {
    const u = this._getOrCreate(userId);
    const set = u.courseProgress.get(courseId);
    if (!set || set.size === 0) return null;
    return {
      courseId,
      completedLessonIds: [...set],
      status: 'in_progress',
    };
  }

  async getStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    history: string[];
  }> {
    const u = this._getOrCreate(userId);
    return {
      currentStreak: u.currentStreak,
      longestStreak: u.longestStreak,
      history: [...u.streakHistory],
    };
  }

  async getXP(userId: string): Promise<number> {
    const u = this._getOrCreate(userId);
    return u.totalXp;
  }

  async getLeaderboard(_timeframe?: string): Promise<Array<{
    userId: string;
    totalXp: number;
    level: number;
    currentStreak: number;
    rank: number;
  }>> {
    const sorted = [...this.users.values()]
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 100);

    return sorted.map((u, idx) => ({
      userId: u.id,
      totalXp: u.totalXp,
      level: mockCalcLevel(u.totalXp),
      currentStreak: u.currentStreak,
      rank: idx + 1,
    }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LocalStorageProgressService (Zero-config stub)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "superteam_academy_progress";

function loadAllProgress(): Record<string, UserProgress> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveAllProgress(data: Record<string, UserProgress>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createDefaultUser(userId: string): UserProgress {
  return {
    userId,
    courses: {},
    totalXP: 0,
    level: 0,
    streak: 1,
    lastActivityDate: new Date().toISOString(),
    achievements: [],
  };
}

export class LocalStorageProgressService implements ILearningProgressService {
  async getProgress(
    userId: string,
    courseId: string
  ): Promise<CourseProgress | null> {
    const all = loadAllProgress();
    return all[userId]?.courses[courseId] ?? null;
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
    xpReward = XP_PER_LESSON
  ): Promise<{ xpEarned: number; newLevel: number; leveledUp: boolean }> {
    const all = loadAllProgress();
    const user = all[userId] ?? createDefaultUser(userId);

    if (!user.courses[courseId]) {
      user.courses[courseId] = {
        courseId,
        completedLessons: [],
        startedAt: new Date().toISOString(),
      };
    }

    const course = user.courses[courseId];

    const alreadyCompleted = course.completedLessons.some(
      (l) => l.lessonIndex === lessonIndex
    );
    if (alreadyCompleted) {
      return { xpEarned: 0, newLevel: user.level, leveledUp: false };
    }

    const today = new Date().toDateString();
    const lastActivity = new Date(user.lastActivityDate).toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();

    if (lastActivity === today) {
      // Same day, no streak change
    } else if (lastActivity === yesterday) {
      user.streak += 1;
    } else {
      user.streak = 1;
    }

    user.lastActivityDate = new Date().toISOString();

    const streakBonus =
      user.streak >= 7 ? STREAK_BONUS_XP * 2 : user.streak >= 3 ? STREAK_BONUS_XP : 0;
    const totalXpEarned = xpReward + streakBonus;

    course.completedLessons.push({
      lessonIndex,
      completedAt: new Date().toISOString(),
      xpEarned: totalXpEarned,
    });

    const oldLevel = user.level;
    user.totalXP += totalXpEarned;
    user.level = calculateLevel(user.totalXP);

    this._checkAchievements(user);

    all[userId] = user;
    saveAllProgress(all);

    return {
      xpEarned: totalXpEarned,
      newLevel: user.level,
      leveledUp: user.level > oldLevel,
    };
  }

  async getXP(userId: string): Promise<{ totalXP: number; level: number }> {
    const all = loadAllProgress();
    const user = all[userId] ?? createDefaultUser(userId);
    return { totalXP: user.totalXP, level: user.level };
  }

  async getLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]> {
    const all = loadAllProgress();
    const entries: LeaderboardEntry[] = Object.values(all)
      .sort((a, b) => b.totalXP - a.totalXP)
      .map((user, idx) => ({
        userId: user.userId,
        displayName: `User ${user.userId.slice(0, 6)}`,
        totalXP: user.totalXP,
        level: user.level,
        streak: user.streak,
        rank: idx + 1,
      }));

    void timeframe; // timeframe filtering not applicable to localStorage
    return entries.slice(0, 50);
  }

  async getUserProfile(userId: string): Promise<UserProgress> {
    const all = loadAllProgress();
    return all[userId] ?? createDefaultUser(userId);
  }

  private _checkAchievements(user: UserProgress): void {
    const totalLessons = Object.values(user.courses).reduce(
      (sum, c) => sum + c.completedLessons.length,
      0
    );

    const achievements: Array<{ id: string; condition: boolean }> = [
      { id: "first_lesson", condition: totalLessons >= 1 },
      { id: "ten_lessons",  condition: totalLessons >= 10 },
      { id: "level_5",      condition: user.level >= 5 },
      { id: "level_10",     condition: user.level >= 10 },
      { id: "streak_7",     condition: user.streak >= 7 },
      { id: "streak_30",    condition: user.streak >= 30 },
      { id: "xp_500",       condition: user.totalXP >= 500 },
      { id: "xp_1000",      condition: user.totalXP >= 1000 },
    ];

    for (const { id, condition } of achievements) {
      if (condition && !user.achievements.includes(id)) {
        user.achievements.push(id);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SupabaseProgressService
// ─────────────────────────────────────────────────────────────────────────────
//
//   CREATE TABLE IF NOT EXISTS user_progress (
//     user_id      TEXT PRIMARY KEY,
//     total_xp     INTEGER NOT NULL DEFAULT 0,
//     level        INTEGER NOT NULL DEFAULT 0,
//     streak       INTEGER NOT NULL DEFAULT 1,
//     achievements TEXT[]  NOT NULL DEFAULT '{}',
//     last_activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
//   );
//
//   CREATE TABLE IF NOT EXISTS lesson_completions (
//     id           BIGSERIAL PRIMARY KEY,
//     user_id      TEXT NOT NULL REFERENCES user_progress(user_id),
//     course_id    TEXT NOT NULL,
//     lesson_index INTEGER NOT NULL,
//     xp_earned    INTEGER NOT NULL DEFAULT 50,
//     completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//     UNIQUE(user_id, course_id, lesson_index)
//   );
//
//   CREATE INDEX idx_lesson_completions_user ON lesson_completions(user_id);
//   CREATE INDEX idx_lesson_completions_course ON lesson_completions(user_id, course_id);
//   CREATE INDEX idx_user_progress_xp ON user_progress(total_xp DESC);
// ─────────────────────────────────────────────────────────────────────────────

export class SupabaseProgressService implements ILearningProgressService {
  private async getClient() {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Add them to .env.local or fall back to NEXT_PUBLIC_BACKEND=localstorage."
      );
    }
    return createClient(url, key);
  }

  async getProgress(
    userId: string,
    courseId: string
  ): Promise<CourseProgress | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("lesson_completions")
      .select("lesson_index, xp_earned, completed_at")
      .eq("user_id", userId)
      .eq("course_id", courseId);

    if (error || !data?.length) return null;

    return {
      courseId,
      startedAt: data[data.length - 1].completed_at,
      completedLessons: data.map((row) => ({
        lessonIndex: row.lesson_index,
        xpEarned: row.xp_earned,
        completedAt: row.completed_at,
      })),
    };
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
    xpReward = XP_PER_LESSON
  ): Promise<{ xpEarned: number; newLevel: number; leveledUp: boolean }> {
    const supabase = await this.getClient();

    await supabase
      .from("user_progress")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

    const { error: insertError } = await supabase
      .from("lesson_completions")
      .insert({
        user_id: userId,
        course_id: courseId,
        lesson_index: lessonIndex,
        xp_earned: xpReward,
      });

    if (insertError?.code === "23505") {
      const { totalXP, level } = await this.getXP(userId);
      return { xpEarned: 0, newLevel: level, leveledUp: false };
    }
    if (insertError) throw insertError;

    const { data: profile, error: fetchError } = await supabase
      .from("user_progress")
      .select("total_xp, level, streak, last_activity_date")
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;

    const today = new Date().toDateString();
    const lastActivity = new Date(profile.last_activity_date).toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();

    let newStreak = profile.streak;
    if (lastActivity === today) {
      // no change
    } else if (lastActivity === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const streakBonus =
      newStreak >= 7 ? STREAK_BONUS_XP * 2 : newStreak >= 3 ? STREAK_BONUS_XP : 0;
    const totalXpEarned = xpReward + streakBonus;
    const newTotalXP = (profile.total_xp ?? 0) + totalXpEarned;
    const oldLevel = profile.level ?? 0;
    const newLevel = calculateLevel(newTotalXP);

    await supabase
      .from("user_progress")
      .update({
        total_xp: newTotalXP,
        level: newLevel,
        streak: newStreak,
        last_activity_date: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return { xpEarned: totalXpEarned, newLevel, leveledUp: newLevel > oldLevel };
  }

  async getXP(userId: string): Promise<{ totalXP: number; level: number }> {
    const supabase = await this.getClient();
    const { data } = await supabase
      .from("user_progress")
      .select("total_xp, level")
      .eq("user_id", userId)
      .maybeSingle();

    return { totalXP: data?.total_xp ?? 0, level: data?.level ?? 0 };
  }

  async getLeaderboard(_timeframe: Timeframe): Promise<LeaderboardEntry[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("user_progress")
      .select("user_id, total_xp, level, streak")
      .order("total_xp", { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data ?? []).map((row, idx) => ({
      userId: row.user_id,
      displayName: `User ${row.user_id.slice(0, 6)}`,
      totalXP: row.total_xp,
      level: row.level,
      streak: row.streak,
      rank: idx + 1,
    }));
  }

  async getUserProfile(userId: string): Promise<UserProgress> {
    const supabase = await this.getClient();
    const { data } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return createDefaultUser(userId);

    const { data: lessons } = await supabase
      .from("lesson_completions")
      .select("course_id, lesson_index, xp_earned, completed_at")
      .eq("user_id", userId);

    const courses: Record<string, CourseProgress> = {};
    for (const lesson of lessons ?? []) {
      if (!courses[lesson.course_id]) {
        courses[lesson.course_id] = {
          courseId: lesson.course_id,
          completedLessons: [],
          startedAt: lesson.completed_at,
        };
      }
      courses[lesson.course_id].completedLessons.push({
        lessonIndex: lesson.lesson_index,
        xpEarned: lesson.xp_earned,
        completedAt: lesson.completed_at,
      });
    }

    return {
      userId,
      courses,
      totalXP: data.total_xp,
      level: data.level,
      streak: data.streak,
      lastActivityDate: data.last_activity_date,
      achievements: data.achievements ?? [],
    };
  }
}

// ─── OnChain Stub (future Anchor integration) ────────────────────────────────

export class OnChainProgressService implements ILearningProgressService {
  async getProgress(_userId: string, _courseId: string): Promise<null> {
    throw new Error(
      "OnChainProgressService not yet implemented. Set NEXT_PUBLIC_BACKEND=localstorage or supabase."
    );
  }
  async completeLesson(): Promise<never> {
    throw new Error("OnChainProgressService not yet implemented.");
  }
  async getXP(_userId: string): Promise<never> {
    throw new Error("OnChainProgressService not yet implemented.");
  }
  async getLeaderboard(_timeframe: Timeframe): Promise<never> {
    throw new Error("OnChainProgressService not yet implemented.");
  }
  async getUserProfile(_userId: string): Promise<never> {
    throw new Error("OnChainProgressService not yet implemented.");
  }
}

// ─── Factory: pick implementation from env ───────────────────────────────────

export function createLearningProgressService(): ILearningProgressService {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? "localstorage";

  switch (backend) {
    case "supabase":
      return new SupabaseProgressService();
    case "onchain":
      return new OnChainProgressService();
    case "localstorage":
    default:
      return new LocalStorageProgressService();
  }
}

// Singleton — import this wherever you need the service
export const learningProgressService = createLearningProgressService();
