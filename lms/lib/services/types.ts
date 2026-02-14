import type { Course } from "@/types/course";
import type { Progress, LeaderboardEntry, StreakData, UserProfile } from "@/types/user";
import type { Achievement } from "@/types/gamification";
import type { Credential } from "@/types/credential";

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress | null>;
  getAllProgress(userId: string): Promise<Progress[]>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  enrollInCourse(userId: string, courseId: string): Promise<void>;
  unenrollFromCourse(userId: string, courseId: string): Promise<void>;
  getXP(userId: string): Promise<number>;
  getLevel(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: "weekly" | "monthly" | "all-time"): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<Credential[]>;
  getAchievements(userId: string): Promise<Achievement[]>;
  claimAchievement(userId: string, achievementId: number): Promise<void>;
  getProfile(userId: string): Promise<UserProfile | null>;
  getDisplayName(userId: string): Promise<string | null>;
  setDisplayName(userId: string, name: string): Promise<void>;
  getCourses(): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
}
