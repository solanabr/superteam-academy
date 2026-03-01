import { PublicKey } from "@solana/web3.js";

// Course Types
export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "reading" | "challenge";
  content?: string;
  code?: string;
  solution?: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: number;
  xp: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  track: string;
  duration: string;
  badge: string;
  prerequisites: string[];
  rewards: string[];
  milestones: { lesson: number; name: string; xp: number }[];
  modules: Module[];
}

// User Progress Types
export interface Progress {
  courseId: string;
  userId: string;
  completedLessons: string[];
  currentLesson: string;
  progress: number;
  enrolledAt: string;
  lastAccessedAt: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActive: string;
  history: { date: string; active: boolean }[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
  icon: string;
}

export interface Credential {
  id: string;
  track: string;
  level: number;
  earnedAt: string;
  xp: number;
  mintAddress: string;
  metadata: {
    name: string;
    image: string;
    attributes: { trait_type: string; value: string }[];
  };
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  avatar?: string;
}

export interface UserStats {
  totalXP: number;
  level: number;
  rank: number;
  streak: number;
  completedCourses: number;
  achievements: number;
}

// Service Interfaces (as required by bounty)
export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress | null>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: "weekly" | "monthly" | "alltime"): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
  getAchievements(userId: string): Promise<Achievement[]>;
  getUserStats(userId: string): Promise<UserStats>;
}

export interface CourseService {
  getAllCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | null>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  getLesson(courseId: string, lessonId: string): Promise<Lesson | null>;
}

export interface EnrollmentService {
  enroll(userId: string, courseId: string): Promise<void>;
  unenroll(userId: string, courseId: string): Promise<void>;
  isEnrolled(userId: string, courseId: string): Promise<boolean>;
  getEnrolledCourses(userId: string): Promise<string[]>;
}

export interface XPTokenService {
  getBalance(wallet: PublicKey): Promise<number>;
  getLevel(xp: number): number;
  getXPToNextLevel(currentLevel: number): number;
  getProgressToNextLevel(xp: number): number;
}
