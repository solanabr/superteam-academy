import type { LearningProgressService } from "./types";
import type { Course } from "@/types/course";
import type { Progress, LeaderboardEntry, StreakData, UserProfile } from "@/types/user";
import type { Achievement } from "@/types/gamification";
import type { Credential } from "@/types/credential";
import { ACHIEVEMENTS } from "@/types/gamification";
import { getLevel, getUtcDay } from "@/lib/utils";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";

const STORAGE_PREFIX = "sta_";

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  return raw ? JSON.parse(raw) : fallback;
}

function setItem(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
}

export class LocalStorageService implements LearningProgressService {
  async getProgress(userId: string, courseId: string): Promise<Progress | null> {
    const all = await this.getAllProgress(userId);
    return all.find((p) => p.courseId === courseId) ?? null;
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    return getItem<Progress[]>(`progress_${userId}`, []);
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    const all = await this.getAllProgress(userId);
    const idx = all.findIndex((p) => p.courseId === courseId);
    if (idx === -1) return;

    const progress = all[idx];
    if (!progress.lessonsCompleted.includes(lessonIndex)) {
      progress.lessonsCompleted.push(lessonIndex);
      progress.percentComplete = (progress.lessonsCompleted.length / progress.totalLessons) * 100;

      if (progress.lessonsCompleted.length === progress.totalLessons) {
        progress.completedAt = new Date().toISOString();
      }
    }
    all[idx] = progress;
    setItem(`progress_${userId}`, all);

    // Update XP
    const xp = getItem<number>(`xp_${userId}`, 0);
    setItem(`xp_${userId}`, xp + 50);

    // Update streak
    const streak = getItem<{ current: number; longest: number; lastDay: number }>(`streak_${userId}`, { current: 0, longest: 0, lastDay: 0 });
    const today = getUtcDay();
    if (today > streak.lastDay) {
      if (today === streak.lastDay + 1) {
        streak.current += 1;
      } else {
        streak.current = 1;
      }
      streak.lastDay = today;
      if (streak.current > streak.longest) streak.longest = streak.current;
      setItem(`streak_${userId}`, streak);
    }
  }

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    const all = await this.getAllProgress(userId);
    if (all.some((p) => p.courseId === courseId)) return;

    const course = await this.getCourse(courseId);
    if (!course) return;

    all.push({
      courseId,
      enrolledAt: new Date().toISOString(),
      lessonsCompleted: [],
      totalLessons: course.lessonCount,
      percentComplete: 0,
    });
    setItem(`progress_${userId}`, all);
  }

  async unenrollFromCourse(userId: string, courseId: string): Promise<void> {
    const all = await this.getAllProgress(userId);
    setItem(`progress_${userId}`, all.filter((p) => p.courseId !== courseId));
  }

  async getXP(userId: string): Promise<number> {
    return getItem<number>(`xp_${userId}`, 0);
  }

  async getLevel(userId: string): Promise<number> {
    const xp = await this.getXP(userId);
    return getLevel(xp);
  }

  async getStreak(userId: string): Promise<StreakData> {
    const streak = getItem<{ current: number; longest: number; lastDay: number }>(`streak_${userId}`, { current: 0, longest: 0, lastDay: 0 });
    const history: StreakData["history"] = [];
    const today = getUtcDay();
    for (let i = 29; i >= 0; i--) {
      const day = today - i;
      const date = new Date(day * 86400 * 1000).toISOString().split("T")[0];
      history.push({
        date,
        active: day >= streak.lastDay - streak.current + 1 && day <= streak.lastDay,
        frozen: false,
      });
    }
    return {
      current: streak.current,
      longest: streak.longest,
      lastActivityDate: streak.lastDay * 86400,
      freezesAvailable: 0,
      history,
    };
  }

  async getLeaderboard(_timeframe: "weekly" | "monthly" | "all-time"): Promise<LeaderboardEntry[]> {
    return [
      { rank: 1, wallet: "7xKXt...abc", displayName: "SolanaBuilder", xp: 15200, level: 12, streak: 45 },
      { rank: 2, wallet: "9mPQr...def", displayName: "RustMaster", xp: 12800, level: 11, streak: 30 },
      { rank: 3, wallet: "3kLnY...ghi", displayName: "AnchorDev", xp: 9500, level: 9, streak: 22 },
      { rank: 4, wallet: "5hRcV...jkl", displayName: "DeFiWizard", xp: 7200, level: 8, streak: 15 },
      { rank: 5, wallet: "2wXpZ...mno", displayName: "TokenHunter", xp: 5100, level: 7, streak: 10 },
      { rank: 6, wallet: "8nBqS...pqr", displayName: "CryptoLearner", xp: 3800, level: 6, streak: 7 },
      { rank: 7, wallet: "4jFdR...stu", displayName: "ChainExplorer", xp: 2400, level: 4, streak: 5 },
      { rank: 8, wallet: "6tMwK...vwx", displayName: "Web3Student", xp: 1600, level: 4, streak: 3 },
      { rank: 9, wallet: "1qAeP...yza", displayName: "BlockchainBob", xp: 900, level: 3, streak: 2 },
      { rank: 10, wallet: "0pZsN...bcd", displayName: "SolNewbie", xp: 400, level: 2, streak: 1 },
    ];
  }

  async getCredentials(_wallet: string): Promise<Credential[]> {
    return [];
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const claimedIds = getItem<number[]>(`achievements_${userId}`, []);
    return ACHIEVEMENTS.map((a) => ({ ...a, claimed: claimedIds.includes(a.id) }));
  }

  async claimAchievement(userId: string, achievementId: number): Promise<void> {
    const claimed = getItem<number[]>(`achievements_${userId}`, []);
    if (claimed.includes(achievementId)) return;
    claimed.push(achievementId);
    setItem(`achievements_${userId}`, claimed);

    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (achievement) {
      const xp = getItem<number>(`xp_${userId}`, 0);
      setItem(`xp_${userId}`, xp + achievement.xpReward);
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const xp = await this.getXP(userId);
    const streak = await this.getStreak(userId);
    return {
      wallet: userId,
      xp,
      level: getLevel(xp),
      currentStreak: streak.current,
      longestStreak: streak.longest,
      lastActivityDate: streak.lastActivityDate,
      streakFreezes: streak.freezesAvailable,
      achievementFlags: [BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
      referralCount: 0,
      hasReferrer: false,
      joinedAt: new Date().toISOString(),
    };
  }

  async getCourses(): Promise<Course[]> {
    return SAMPLE_COURSES;
  }

  async getCourse(courseId: string): Promise<Course | null> {
    return SAMPLE_COURSES.find((c) => c.id === courseId || c.slug === courseId) ?? null;
  }
}
