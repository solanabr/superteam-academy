import type { PublicKey } from "@solana/web3.js";

// ============================================
// Core Domain Types
// ============================================

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Track = "fundamentals" | "defi" | "nft" | "gaming" | "infrastructure" | "security";
export type LessonType = "content" | "challenge" | "video";
export type AuthProvider = "wallet" | "google" | "github";

// ============================================
// User & Auth
// ============================================

export interface User {
  id: string;
  wallet?: string;
  email?: string;
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  joinedAt: Date;
  authProviders: AuthProvider[];
  isPublic: boolean;
}

export interface SocialLinks {
  twitter?: string;
  github?: string;
  discord?: string;
  website?: string;
}

// ============================================
// Courses & Content
// ============================================

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  difficulty: Difficulty;
  track: Track;
  durationMinutes: number;
  lessonCount: number;
  xpReward: number;
  instructor: Instructor;
  modules: Module[];
  prerequisiteId?: string;
  prerequisites?: string[];
  learningObjectives?: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Instructor {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  title?: string;
  wallet?: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: LessonType;
  order: number;
  durationMinutes: number;
  videoUrl?: string;
  thumbnail?: string;
  xpReward: number;
  content?: string;
  challenge?: Challenge;
}

export interface Challenge {
  id: string;
  description: string;
  instructions?: string;
  starterCode: string;
  solution: string;
  language: "rust" | "typescript" | "json";
  testCases: TestCase[];
  hint?: string;
  hints: string[];
}

export interface TestCase {
  id: string;
  description: string;
  input?: string;
  expectedOutput: string;
  isHidden: boolean;
}

// ============================================
// Progress & Gamification
// ============================================

export interface Progress {
  courseId: string;
  completedLessons: string[];
  totalLessons: number;
  percentComplete: number;
  enrolledAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  freezesAvailable: number;
  streakHistory: StreakDay[];
}

export interface StreakDay {
  date: string;
  hadActivity: boolean;
  usedFreeze: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "progress" | "streak" | "skill" | "community" | "special";
  xpReward: number;
  requirement?: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username?: string;
  walletAddress: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  change?: number;
}

// ============================================
// Credentials (On-Chain)
// ============================================

export interface Credential {
  id: string;
  name: string;
  description?: string;
  image?: string;
  track: Track;
  level: number;
  coursesCompleted: number;
  xpEarned: number;
  metadataUri: string;
  mint: string;
  owner: string;
  verified: boolean;
  attributes?: { trait_type: string; value: string }[];
  mintedAt?: Date;
  updatedAt: Date;
}

// ============================================
// UI State
// ============================================

export interface CourseFilters {
  difficulty?: Difficulty[];
  track?: Track[];
  duration?: "short" | "medium" | "long";
  search?: string;
}

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
