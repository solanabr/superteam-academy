import { PublicKey } from "@solana/web3.js";

// ─── Course ─────────────────────────────────────────────
export interface Course {
  id: string;
  courseId: string;
  title: string;
  description: string;
  slug: string;
  creator: string;
  difficulty: 1 | 2 | 3;
  lessonCount: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: string | null;
  isActive: boolean;
  totalCompletions: number;
  creatorRewardXp: number;
  thumbnailUrl?: string;
  duration?: string;
  modules: Module[];
  whatYouLearn?: string[];
  instructor?: {
    name: string;
    avatar?: string;
    bio?: string;
  };
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  order: number;
  type: "content" | "challenge" | "quiz";
  content?: string;
  challenge?: Challenge;
  quiz?: Quiz;
  xp: number;
  duration?: string;
}

export interface Quiz {
  questions: QuizQuestion[];
  passingScore: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Challenge {
  prompt: string;
  objectives: string[];
  starterCode: string;
  language: "rust" | "typescript" | "json";
  testCases: TestCase[];
  solution?: string;
  hints?: string[];
}

export interface TestCase {
  id: string;
  name: string;
  input?: string;
  expectedOutput: string;
  hidden?: boolean;
}

// ─── Enrollment ─────────────────────────────────────────
export interface Enrollment {
  courseId: string;
  learner: string;
  lessonFlags: number[];
  enrolledAt: number;
  completedAt: number | null;
  credentialAsset: string | null;
}

// ─── User / Profile ─────────────────────────────────────
export interface UserProfile {
  id: string;
  walletAddress: string | null;
  email: string | null;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  socialLinks: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  joinedAt: string;
  isPublic: boolean;
  preferredLanguage: string;
  theme: "light" | "dark" | "system";
}

// ─── Gamification ───────────────────────────────────────
export interface XPBalance {
  amount: number;
  level: number;
  progress: number;
  nextLevelXp: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakHistory: Record<string, boolean>;
  hasFreezeAvailable: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "progress" | "streak" | "skill" | "community" | "special";
  iconUrl: string;
  xpReward: number;
  isEarned: boolean;
  earnedAt?: string;
  progress?: number;
  maxProgress?: number;
}

// ─── Credential ─────────────────────────────────────────
export interface Credential {
  mintAddress: string;
  name: string;
  metadataUri: string;
  imageUrl: string;
  trackId: number;
  trackLevel: number;
  coursesCompleted: number;
  totalXp: number;
  owner: string;
  collection: string;
}

// ─── Leaderboard ────────────────────────────────────────
export type LeaderboardTimeframe = "weekly" | "monthly" | "all-time";

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak?: number;
}

// ─── Activity ───────────────────────────────────────────
export interface ActivityItem {
  id: string;
  type:
    | "lesson_completed"
    | "course_enrolled"
    | "course_completed"
    | "achievement_earned"
    | "xp_earned"
    | "credential_issued";
  title: string;
  description: string;
  xp?: number;
  timestamp: string;
  courseId?: string;
  lessonIndex?: number;
}

// ─── Course Progress ────────────────────────────────────
export interface CourseProgress {
  courseId: string;
  completedLessons: number[];
  totalLessons: number;
  completionPercentage: number;
  isCompleted: boolean;
  isFinalized: boolean;
  enrolledAt: string;
  completedAt: string | null;
  xpEarned: number;
}

// ─── Props ──────────────────────────────────────────────
export interface SearchParams {
  difficulty?: string;
  track?: string;
  search?: string;
  page?: string;
}
