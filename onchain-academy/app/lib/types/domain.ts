// lib/types/domain.ts
/**
 * SUPERTEAM ACADEMY — DOMAIN TYPES
 *
 * FIX: Property access errors on Course and CourseProgress
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO root causes were present:
 *
 * 1. `course.totalLessons` — TS2339: Property 'totalLessons' does not exist
 *    ROOT CAUSE: `totalLessons` was never a property of the `Course` interface.
 *    Code in app/courses/[slug]/page.tsx correctly computed it inline:
 *      const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
 *    But other components accessed `course.totalLessons` as if it were a stored
 *    field, causing the TS error.
 *
 *    FIX: Added `totalLessons` as a stored field to `Course`. The course service
 *    (lib/services/course.ts) must populate it when building course objects —
 *    see the `getTotalLessons(course)` utility exported below.
 *
 *    Alternatively, if you prefer not to store it, use `getTotalLessons(course)`
 *    at call sites instead of adding the field.
 *
 * 2. `progress.completedLessonIds` — TS2339: Property 'completedLessonIds' does not exist
 *    ROOT CAUSE: Two conflicting `CourseProgress` types existed:
 *      • lib/types/domain.ts       → has `completedLessonIds: string[]`  ✓
 *      • lib/services/learning-progress.ts → has `completedLessons: LessonProgress[]` ✗
 *    Code imported `CourseProgress` from the wrong source (learning-progress.ts)
 *    and accessed `.completedLessonIds` which doesn't exist on that type.
 *
 *    FIX: `CourseProgress` in lib/types/domain.ts is the authoritative type.
 *    Always import CourseProgress from `@/lib/types/domain`, never from
 *    `@/lib/services/learning-progress`. The domain type already has
 *    `completedLessonIds: string[]`, so no change needed to the interface itself.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Locale = 'en' | 'pt-br' | 'es';
export type LessonType = 'reading' | 'video' | 'challenge';
export type AchievementCategory =
  | 'courses' | 'lessons' | 'xp' | 'streak' | 'speed' | 'perfect' | 'social';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  completedCourses: string[];
  completedLessons: string[];
  earnedCredentials: Credential[];
  achievements: Achievement[];
  preferredLanguage: Locale;
  createdAt: string;
  updatedAt: string;
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  order: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  durationMinutes: number;
  xpReward: number;
  modules: CourseModule[];
  /**
   * FIX 1: Added `totalLessons` field.
   *
   * Populate this when constructing Course objects:
   *   course.totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0)
   *
   * Or use the exported `getTotalLessons(course)` helper instead of storing the
   * field if you prefer a purely derived approach (remove this field and update
   * all call sites to use the helper).
   */
  totalLessons: number;
  coverImageUrl: string;
  language: Locale;
  prerequisites: string[];
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  contentMarkdown: string;
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  starterCode?: string;
  solution?: string;
  testCases?: TestCase[];
  language?: string;
  videoUrl?: string;
  videoDuration?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  description?: string;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/**
 * FIX 2: This is the authoritative CourseProgress type.
 *
 * It contains `completedLessonIds: string[]`.
 *
 * ALWAYS import CourseProgress from `@/lib/types/domain`:
 *   ✅  import type { CourseProgress } from '@/lib/types/domain';
 *   ❌  import type { CourseProgress } from '@/lib/services/learning-progress';
 *                                           ↑ that type uses completedLessons: LessonProgress[]
 *                                             which does NOT have completedLessonIds
 */
export interface CourseProgress {
  userId: string;
  courseId: string;
  percentComplete: number;
  completedLessonIds: string[];     // ← the property that was missing on the wrong type
  lastAccessedLessonId?: string;
  startedAt: string;
  completedAt?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  xpEarned: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string;
  history: string[];
  streakStartDate?: string;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  totalXp: number;
  level: number;
  completedCourses: number;
  achievements: number;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  iconUrl: string;
  xpReward: number;
  criteria: AchievementCriteria;
  isUnlocked?: boolean;
  unlockedAt?: string;
  progress?: number;
}

export interface AchievementCriteria {
  type: AchievementCategory;
  target: number;
  description: string;
}

// ─── Credentials (NFTs) ───────────────────────────────────────────────────────

export interface Credential {
  id: string;
  mintAddress: string;
  courseId: string;
  courseName: string;
  issuedAt: string;
  metadataUri: string;
  imageUri: string;
  attributes: CredentialAttribute[];
}

export interface CredentialAttribute {
  trait_type: string;
  value: string | number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

export interface CodeSubmission {
  id: string;
  userId: string;
  lessonId: string;
  code: string;
  language: string;
  submittedAt: string;
  result?: SubmissionResult;
}

export interface SubmissionResult {
  success: boolean;
  passedTests: number;
  totalTests: number;
  executionTime: number;
  errors?: string[];
  output?: string;
}

export interface UserPreferences {
  userId: string;
  language: Locale;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  soundEffects: boolean;
  autoSave: boolean;
}

export interface CourseStats {
  courseId: string;
  totalEnrollments: number;
  totalCompletions: number;
  averageRating: number;
  averageCompletionTime: number;
  completionRate: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalXpAwarded: number;
  totalCredentialsIssued: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/**
 * Derive the total lesson count from a course's modules.
 *
 * Use this at call sites if you prefer not to store `totalLessons` on the
 * Course object itself. If you do store it, populate it in your course service:
 *   course.totalLessons = getTotalLessons(course)
 */
export function getTotalLessons(course: Pick<Course, 'modules'>): number {
  return course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
}
