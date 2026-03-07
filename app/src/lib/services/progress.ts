import type { Progress, CompletionResult, StreakData, LeaderboardEntry } from "@/types/progress";
import type { XPEvent, Achievement } from "@/types";

/**
 * LearningProgressService interface for managing user learning progress
 * Implements XP system, streaks, achievements, and leaderboards
 */
export interface LearningProgressService {
  // Enrollment
  enrollInCourse(userId: string, courseSlug: string): Promise<void>;
  getProgress(userId: string, courseSlug: string): Promise<Progress | null>;
  getAllProgress(userId: string): Promise<Progress[]>;

  // Lesson completion
  completeLesson(userId: string, courseSlug: string, lessonId: string): Promise<CompletionResult>;
  isLessonCompleted(userId: string, courseSlug: string, lessonId: string): Promise<boolean>;

  // XP
  getXP(userId: string): Promise<number>;
  getLevel(userId: string): Promise<number>;
  getXPHistory(userId: string): Promise<XPEvent[]>;

  // Streaks
  getStreak(userId: string): Promise<StreakData>;

  // Achievements
  getAchievements(userId: string): Promise<Achievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;

  // Leaderboard
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    limit?: number,
    courseSlug?: string | null
  ): Promise<LeaderboardEntry[]>;
  getUserRank(
    userId: string,
    timeframe: "weekly" | "monthly" | "alltime",
    courseSlug?: string | null
  ): Promise<number>;
}
