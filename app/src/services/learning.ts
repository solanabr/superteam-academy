import { PublicKey } from "@solana/web3.js";
import {
  LearningProgressService,
  CourseService,
  EnrollmentService,
  XPTokenService,
  Progress,
  StreakData,
  Achievement,
  Credential,
  LeaderboardEntry,
  UserStats,
  Course,
  Lesson,
} from "@/types";
import { COURSES } from "@/data/courses";
import { getXPBalance, getCredentials as getBlockchainCredentials } from "@/lib/blockchain";

// LocalStorage-based implementation (stub for on-chain integration)
export class LocalStorageLearningService implements LearningProgressService {
  private getKey(userId: string, courseId: string): string {
    return `progress_${userId}_${courseId}`;
  }

  async getProgress(userId: string, courseId: string): Promise<Progress | null> {
    if (typeof window === "undefined") return null;
    const key = this.getKey(userId, courseId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<void> {
    if (typeof window === "undefined") return;
    
    const key = this.getKey(userId, courseId);
    const existing = await this.getProgress(userId, courseId);
    
    const progress: Progress = existing || {
      courseId,
      userId,
      completedLessons: [],
      currentLesson: `${lessonIndex}`,
      progress: 0,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };

    const lessonId = `${lessonIndex}`;
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
    }

    // Calculate progress percentage
    const course = COURSES.find((c) => c.id === courseId);
    if (course) {
      progress.progress = Math.round(
        (progress.completedLessons.length / course.lessons) * 100
      );
    }

    progress.lastAccessedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(progress));
  }

  async getXP(userId: string): Promise<number> {
    if (typeof window === "undefined") return 0;
    const key = `xp_${userId}`;
    const xp = localStorage.getItem(key);
    return xp ? parseInt(xp, 10) : 0;
  }

  async addXP(userId: string, amount: number): Promise<void> {
    if (typeof window === "undefined") return;
    const currentXP = await this.getXP(userId);
    localStorage.setItem(`xp_${userId}`, (currentXP + amount).toString());
  }

  async getStreak(userId: string): Promise<StreakData> {
    if (typeof window === "undefined") {
      return {
        current: 0,
        longest: 0,
        lastActive: new Date().toISOString(),
        history: [],
      };
    }

    const key = `streak_${userId}`;
    const data = localStorage.getItem(key);
    
    if (data) {
      return JSON.parse(data);
    }

    return {
      current: 0,
      longest: 0,
      lastActive: new Date().toISOString(),
      history: [],
    };
  }

  async updateStreak(userId: string): Promise<void> {
    if (typeof window === "undefined") return;
    
    const streak = await this.getStreak(userId);
    const today = new Date().toISOString().split("T")[0];
    const lastActive = streak.lastActive.split("T")[0];

    if (today !== lastActive) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastActive === yesterdayStr) {
        streak.current += 1;
      } else {
        streak.current = 1;
      }

      if (streak.current > streak.longest) {
        streak.longest = streak.current;
      }

      streak.lastActive = new Date().toISOString();
      streak.history.push({ date: today, active: true });
      
      localStorage.setItem(`streak_${userId}`, JSON.stringify(streak));
    }
  }

  async getLeaderboard(timeframe: "weekly" | "monthly" | "alltime"): Promise<LeaderboardEntry[]> {
    // Return mock data for now - will be replaced with on-chain indexing
    const mockData: LeaderboardEntry[] = [
      { rank: 1, address: "7xKX...sAsU", name: "solanadev_eth", xp: 15420, level: 12, streak: 45, avatar: "🔷" },
      { rank: 2, address: "GDfn...1XYZ", name: "anchor_master", xp: 12850, level: 11, streak: 32, avatar: "🟢" },
      { rank: 3, address: "8ZVf...3ABC", name: "defi_queen", xp: 11200, level: 10, streak: 28, avatar: "👑" },
      { rank: 4, address: "9YAf...4DEF", name: "nft_builder", xp: 9870, level: 9, streak: 21, avatar: "🎨" },
      { rank: 5, address: "1ZBZ...5GHI", name: "rust_wizard", xp: 8540, level: 9, streak: 18, avatar: "🧙" },
    ];
    return mockData;
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    // Fetch real credentials from blockchain via Helius DAS API
    return getBlockchainCredentials(wallet);
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return [
      { id: "1", name: "First Steps", description: "Complete your first lesson", earned: true, earnedAt: "2026-01-01", icon: "🎯" },
      { id: "2", name: "Week Warrior", description: "7-day streak", earned: true, earnedAt: "2026-01-08", icon: "🔥" },
      { id: "3", name: "Course Completer", description: "Complete a full course", earned: true, earnedAt: "2026-01-15", icon: "🏆" },
    ];
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const xp = await this.getXP(userId);
    const level = Math.floor(Math.sqrt(xp / 100)) || 1;
    
    return {
      totalXP: xp,
      level,
      rank: 42,
      streak: 7,
      completedCourses: 1,
      achievements: 3,
    };
  }
}

export class StaticCourseService implements CourseService {
  async getAllCourses(): Promise<Course[]> {
    return COURSES;
  }

  async getCourseById(id: string): Promise<Course | null> {
    return COURSES.find((c) => c.id === id) || null;
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    return COURSES.find((c) => c.id === slug) || null;
  }

  async getLesson(courseId: string, lessonId: string): Promise<Lesson | null> {
    const course = await this.getCourseById(courseId);
    if (!course) return null;

    for (const mod of course.modules) {
      const lesson = mod.lessons.find((l) => l.id === lessonId);
      if (lesson) return lesson;
    }
    return null;
  }
}

export class LocalStorageEnrollmentService implements EnrollmentService {
  private getKey(userId: string): string {
    return `enrollments_${userId}`;
  }

  async enroll(userId: string, courseId: string): Promise<void> {
    if (typeof window === "undefined") return;
    const enrolled = await this.getEnrolledCourses(userId);
    if (!enrolled.includes(courseId)) {
      enrolled.push(courseId);
      localStorage.setItem(this.getKey(userId), JSON.stringify(enrolled));
    }
  }

  async unenroll(userId: string, courseId: string): Promise<void> {
    if (typeof window === "undefined") return;
    const enrolled = await this.getEnrolledCourses(userId);
    const filtered = enrolled.filter((id) => id !== courseId);
    localStorage.setItem(this.getKey(userId), JSON.stringify(filtered));
  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrolled = await this.getEnrolledCourses(userId);
    return enrolled.includes(courseId);
  }

  async getEnrolledCourses(userId: string): Promise<string[]> {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(this.getKey(userId));
    return data ? JSON.parse(data) : [];
  }
}

export class XPTokenCalculator implements XPTokenService {
  async getBalance(wallet: PublicKey): Promise<number> {
    // Fetch real XP balance from Token-2022 mint
    return getXPBalance(wallet);
  }

  getLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) || 1;
  }

  getXPToNextLevel(currentLevel: number): number {
    return Math.pow(currentLevel + 1, 2) * 100;
  }

  getProgressToNextLevel(xp: number): number {
    const level = this.getLevel(xp);
    const currentLevelBaseXP = Math.pow(level, 2) * 100;
    const nextLevelXP = Math.pow(level + 1, 2) * 100;
    const progress = ((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }
}

// Service instances
export const learningService = new LocalStorageLearningService();
export const courseService = new StaticCourseService();
export const enrollmentService = new LocalStorageEnrollmentService();
export const xpService = new XPTokenCalculator();
