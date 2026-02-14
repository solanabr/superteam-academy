import type { LearningProgressService } from "./types";
import type { Course } from "@/types/course";
import type { Progress, LeaderboardEntry, StreakData, UserProfile } from "@/types/user";
import type { Achievement } from "@/types/gamification";
import type { Credential } from "@/types/credential";
import { ACHIEVEMENTS } from "@/types/gamification";
import { getLevel, getUtcDay } from "@/lib/utils";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { fetchSanityCourses, fetchSanityCourse } from "./sanity-courses";

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
    if (typeof window === "undefined") return [];
    const entries: LeaderboardEntry[] = [];
    // Scan localStorage for all users with XP
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`${STORAGE_PREFIX}xp_`)) continue;
      const wallet = key.replace(`${STORAGE_PREFIX}xp_`, "");
      if (!wallet || wallet === "guest") continue;
      const xp = getItem<number>(`xp_${wallet}`, 0);
      if (xp <= 0) continue;
      const streak = getItem<{ current: number; longest: number; lastDay: number }>(`streak_${wallet}`, { current: 0, longest: 0, lastDay: 0 });
      const displayName = getItem<string | null>(`name_${wallet}`, null);
      entries.push({
        rank: 0,
        wallet,
        displayName: displayName ?? undefined,
        xp,
        level: getLevel(xp),
        streak: streak.current,
      });
    }
    entries.sort((a, b) => b.xp - a.xp);
    entries.forEach((e, i) => { e.rank = i + 1; });
    return entries;
  }

  async getCredentials(wallet: string): Promise<Credential[]> {
    const progress = await this.getAllProgress(wallet);
    const completed = progress.filter((p) => p.completedAt);
    if (completed.length === 0) return [];

    // Group completions by track
    const trackMap = new Map<number, { count: number; xp: number; first: string; last: string }>();
    for (const p of completed) {
      const course = SAMPLE_COURSES.find((c) => c.id === p.courseId);
      if (!course) continue;
      const existing = trackMap.get(course.trackId);
      if (existing) {
        existing.count++;
        existing.xp += course.xpTotal;
        if (p.completedAt! < existing.first) existing.first = p.completedAt!;
        if (p.completedAt! > existing.last) existing.last = p.completedAt!;
      } else {
        trackMap.set(course.trackId, { count: 1, xp: course.xpTotal, first: p.completedAt!, last: p.completedAt! });
      }
    }

    const credentials: Credential[] = [];
    for (const [trackId, data] of trackMap) {
      credentials.push({
        learner: wallet,
        trackId,
        currentLevel: data.count >= 3 ? 3 : data.count >= 2 ? 2 : 1,
        coursesCompleted: data.count,
        totalXpEarned: data.xp,
        firstEarned: data.first,
        lastUpdated: data.last,
        metadataHash: "",
      });
    }
    return credentials;
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
    const displayName = await this.getDisplayName(userId);
    return {
      wallet: userId,
      displayName: displayName ?? undefined,
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

  async getDisplayName(userId: string): Promise<string | null> {
    return getItem<string | null>(`name_${userId}`, null);
  }

  async setDisplayName(userId: string, name: string): Promise<void> {
    setItem(`name_${userId}`, name);
  }

  async getCourses(): Promise<Course[]> {
    const sanityCourses = await fetchSanityCourses();
    if (sanityCourses.length > 0) return sanityCourses;
    return SAMPLE_COURSES;
  }

  async getCourse(courseId: string): Promise<Course | null> {
    const sanityCourse = await fetchSanityCourse(courseId);
    if (sanityCourse) return sanityCourse;
    return SAMPLE_COURSES.find((c) => c.id === courseId || c.slug === courseId) ?? null;
  }
}
