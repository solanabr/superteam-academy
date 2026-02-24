import type {
  LearningProgressService,
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
} from "./types";
import { courses } from "./courses";
import { getCredentialsByOwner } from "./credentials";
import { getXPBalance } from "./xp";
import { getLeaderboard as fetchLeaderboard } from "./leaderboard";
import { challengeService } from "./challenge-service";

const STORAGE_PREFIX = "stacad:progress:";
const STREAK_PREFIX = "stacad:streak:";
const STREAK_FREEZE_PREFIX = "stacad:streak-freeze:";

export type StreakMilestone = 7 | 30;
const STREAK_MILESTONES: StreakMilestone[] = [7, 30];

/**
 * LocalStorage-backed implementation of LearningProgressService.
 *
 * - Progress, enrollment, streaks, achievements → persisted in localStorage.
 * - XP, credentials, leaderboard → real on-chain reads via Helius/Token-2022.
 *
 * This is a clean abstraction layer: swap this class for an OnChainProgressService
 * once the Anchor program is deployed, without touching any UI code.
 */
export class LocalStorageProgressService implements LearningProgressService {
  private getStore(key: string): Progress | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  }

  private setStore(key: string, value: Progress) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }

  private removeStore(key: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_PREFIX + key);
  }

  private progressKey(userId: string, courseId: string) {
    return `${userId}:${courseId}`;
  }

  // --- Progress (stubbed — localStorage) ---

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const stored = this.getStore(this.progressKey(userId, courseId));
    if (stored) return stored;

    const course = courses.find((c) => c.id === courseId);
    return {
      courseId,
      completedLessons: [],
      totalLessons: course?.lessonCount ?? 0,
      percentage: 0,
      startedAt: new Date().toISOString(),
    };
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    if (typeof window === "undefined") return [];
    const results: Progress[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX + userId + ":")) {
        const raw = localStorage.getItem(key);
        if (raw) results.push(JSON.parse(raw));
      }
    }
    return results;
  }

  // --- Lesson completion (stubbed — localStorage) ---

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void> {
    const progress = await this.getProgress(userId, courseId);
    if (!progress.completedLessons.includes(lessonIndex)) {
      progress.completedLessons.push(lessonIndex);
      progress.percentage = Math.round(
        (progress.completedLessons.length / progress.totalLessons) * 100,
      );
      if (progress.percentage >= 100) {
        progress.completedAt = new Date().toISOString();
      }
    }
    this.setStore(this.progressKey(userId, courseId), progress);

    // Track activity for streak heatmap
    const course = courses.find((c) => c.id === courseId);
    const lessonXp =
      course?.modules
        .flatMap((m) => m.lessons)
        .find((_, i) => i === lessonIndex)?.xpReward ?? 40;
    await this.recordActivity(userId, lessonXp);

    // Update daily challenge progress
    challengeService.updateProgress(userId, "complete_lesson", 1);
    challengeService.updateProgress(userId, "earn_xp", lessonXp);
    challengeService.updateProgress(userId, "maintain_streak", 1);
  }

  // --- Enrollment (stubbed — localStorage) ---

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    const course = courses.find((c) => c.id === courseId);
    this.setStore(this.progressKey(userId, courseId), {
      courseId,
      completedLessons: [],
      totalLessons: course?.lessonCount ?? 0,
      percentage: 0,
      startedAt: new Date().toISOString(),
    });

    // Update daily challenge progress
    challengeService.updateProgress(userId, "enroll_course", 1);
  }

  async unenrollFromCourse(userId: string, courseId: string): Promise<void> {
    this.removeStore(this.progressKey(userId, courseId));
  }

  // --- XP (real on-chain read — Token-2022 soulbound token) ---

  async getXP(userId: string): Promise<number> {
    return getXPBalance(userId);
  }

  /**
   * Compute XP from localStorage progress data.
   * Sum lesson XP for each completed lesson + course bonus if 100% complete.
   */
  async getLocalXP(userId: string): Promise<number> {
    const allProgress = await this.getAllProgress(userId);
    let totalXP = 0;
    for (const progress of allProgress) {
      const course = courses.find((c) => c.id === progress.courseId);
      if (!course) continue;
      const allLessons = course.modules.flatMap((m) => m.lessons);
      for (const lessonIdx of progress.completedLessons) {
        totalXP += allLessons[lessonIdx]?.xpReward ?? 0;
      }
      if (progress.percentage >= 100) {
        totalXP += course.xpReward;
      }
    }
    return totalXP;
  }

  // --- Streak (stubbed — localStorage) ---

  async getStreak(userId: string): Promise<StreakData> {
    if (typeof window === "undefined") {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: "",
        freezesAvailable: 0,
        activityHistory: {},
      };
    }

    const raw = localStorage.getItem(STREAK_PREFIX + userId);
    if (raw) return JSON.parse(raw);

    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: "",
      freezesAvailable: 0,
      activityHistory: {},
    };
  }

  /**
   * Update streak as a side-effect of lesson completion.
   * Returns any newly-hit milestone (7 or 30 days) for celebration UI.
   * In production, this is handled on-chain by the complete_lesson instruction.
   */
  async recordActivity(
    userId: string,
    xpEarned: number = 40,
  ): Promise<StreakMilestone | null> {
    const streak = await this.getStreak(userId);
    const today = new Date().toISOString().slice(0, 10);
    let milestone: StreakMilestone | null = null;
    const prevStreak = streak.currentStreak;

    // Accumulate XP for today
    const todayXp = streak.activityHistory[today] ?? 0;
    streak.activityHistory[today] =
      (typeof todayXp === "number" ? todayXp : 0) + xpEarned;

    // Only bump streak once per day
    if (streak.lastActivityDate !== today) {
      const yesterday = new Date(Date.now() - 86_400_000)
        .toISOString()
        .slice(0, 10);

      if (streak.lastActivityDate === yesterday) {
        streak.currentStreak += 1;
      } else if (this.hasActiveFreeze(userId, streak.lastActivityDate)) {
        // Streak freeze was active -- preserve the streak
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }

      streak.longestStreak = Math.max(
        streak.longestStreak,
        streak.currentStreak,
      );
      streak.lastActivityDate = today;

      // Detect newly crossed milestones
      for (const m of STREAK_MILESTONES) {
        if (streak.currentStreak >= m && prevStreak < m) {
          milestone = m;
        }
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STREAK_PREFIX + userId, JSON.stringify(streak));
    }

    return milestone;
  }

  /**
   * Check if a streak freeze was active covering the gap between lastActivity and today.
   */
  private hasActiveFreeze(userId: string, lastActivityDate: string): boolean {
    if (typeof window === "undefined" || !lastActivityDate) return false;
    const raw = localStorage.getItem(STREAK_FREEZE_PREFIX + userId);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw) as { week: string; usedOn?: string };
      // Freeze covers the day after last activity
      if (data.usedOn) return false; // already consumed
      return true;
    } catch (error) {
      console.error("[learningProgress] Failed to check streak freeze:", error);
      return false;
    }
  }

  /**
   * Claim a streak freeze for this week. Returns true if granted.
   * Each wallet gets 1 free freeze per calendar week (UTC).
   */
  async claimStreakFreeze(userId: string): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
    );
    const currentWeek = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;

    const raw = localStorage.getItem(STREAK_FREEZE_PREFIX + userId);
    if (raw) {
      try {
        const data = JSON.parse(raw) as { week: string };
        if (data.week === currentWeek) return false;
      } catch (error) {
        console.error("[learningProgress] Corrupt streak freeze data:", error);
      }
    }

    localStorage.setItem(
      STREAK_FREEZE_PREFIX + userId,
      JSON.stringify({ week: currentWeek }),
    );

    // Update freezesAvailable in streak data
    const streak = await this.getStreak(userId);
    streak.freezesAvailable = 1;
    localStorage.setItem(STREAK_PREFIX + userId, JSON.stringify(streak));

    return true;
  }

  // --- Leaderboard (real on-chain read — XP token balances) ---

  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
  ): Promise<LeaderboardEntry[]> {
    return fetchLeaderboard(timeframe);
  }

  // --- Credentials (real on-chain read — ZK Compressed credentials (Light Protocol, Photon indexer)) ---

  async getCredentials(walletAddress: string): Promise<Credential[]> {
    return getCredentialsByOwner(walletAddress);
  }

  // --- Finalize Course (stubbed — localStorage credential creation) ---

  async finalizeCourse(
    userId: string,
    courseId: string,
  ): Promise<{ xpAwarded: number; credentialIssued: boolean }> {
    const progress = await this.getProgress(userId, courseId);
    if (progress.percentage < 100) {
      return { xpAwarded: 0, credentialIssued: false };
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      return { xpAwarded: 0, credentialIssued: false };
    }

    // Store local credential record
    const credKey = `stacad:credential:${userId}:${course.track}`;
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem(credKey);
      const cred = existing
        ? JSON.parse(existing)
        : {
            track: course.track,
            level: 0,
            coursesCompleted: 0,
            totalXpEarned: 0,
            firstEarned: new Date().toISOString(),
          };
      cred.level += 1;
      cred.coursesCompleted += 1;
      cred.totalXpEarned += course.xpReward;
      cred.lastUpdated = new Date().toISOString();
      localStorage.setItem(credKey, JSON.stringify(cred));
    }

    return { xpAwarded: course.xpReward, credentialIssued: true };
  }
}

/** Singleton instance — import this across the app */
export const learningService = new LocalStorageProgressService();
