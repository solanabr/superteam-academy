// Core domain types for Superteam Academy

export interface User {
  id: string;
  walletAddress?: string;
  email?: string;
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  joinedAt: Date;
  isPublic: boolean;
}

export interface XPBalance {
  amount: number;
  level: number;
  levelProgress: number; // 0-100 percent to next level
  xpToNextLevel: number;
  xpForCurrentLevel: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  instructor: Instructor;
  difficulty: CourseDifficulty;
  duration: number; // minutes
  lessonCount: number;
  track: Track;
  xpReward: number;
  xpPerLesson: number;
  tags: string[];
  language: string;
  isActive: boolean;
  prerequisiteId?: string;
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  // On-chain
  courseId: string;
  trackId: number;
  trackLevel: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  type: LessonType;
  duration: number; // minutes
  order: number;
  index: number; // bitmap index (0-255)
  xpReward: number;
  content?: LessonContent;
  challenge?: Challenge;
}

export interface LessonContent {
  body: PortableTextBlock[];
  videoUrl?: string;
}

export interface Challenge {
  id: string;
  prompt: string;
  starterCode: string;
  solution: string;
  language: ChallengeLanguage;
  testCases: TestCase[];
  hints: string[];
}

export interface TestCase {
  id: string;
  description: string;
  input?: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: Date;
  completedAt?: Date;
  lessonFlags: number[]; // bitmap as array of numbers
  completedLessons: number;
  isFinalized: boolean;
  credentialAsset?: string;
}

export interface Credential {
  id: string;
  mintAddress: string;
  walletAddress: string;
  track: Track;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  issuedAt: Date;
  name: string;
  imageUri: string;
  metadataUri: string;
  collection: string;
}

export interface Achievement {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  imageUri: string;
  category: AchievementCategory;
  xpReward: number;
  rarity: AchievementRarity;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

export interface AchievementReceipt {
  achievementId: string;
  recipient: string;
  asset: string;
  awardedAt: Date;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
  history: StreakDay[];
  totalActiveDays: number;
  isFrozen: boolean;
}

export interface StreakDay {
  date: string; // ISO date string
  isActive: boolean;
  xpEarned: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  walletAddress: string;
  xp: number;
  level: number;
  streak: number;
  coursesCompleted: number;
}

export interface Track {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  courses: Course[];
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  twitter?: string;
  github?: string;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  isCompleted: boolean;
  isEnrolled: boolean;
  xpEarned: number;
}

// Enums
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LessonType = 'content' | 'challenge' | 'video' | 'quiz';
export type ChallengeLanguage = 'rust' | 'typescript' | 'json' | 'bash';
export type AchievementCategory = 'progress' | 'streak' | 'skill' | 'community' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'alltime';

// Portable Text
export interface PortableTextBlock {
  _type: string;
  _key: string;
  children?: PortableTextSpan[];
  style?: string;
  markDefs?: unknown[];
  code?: string;
  language?: string;
}

export interface PortableTextSpan {
  _type: string;
  _key: string;
  text: string;
  marks?: string[];
}

// Service interfaces
export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<CourseProgress>;
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | null>;
  getAllEnrollments(userId: string): Promise<Enrollment[]>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXpBalance(walletAddress: string): Promise<XPBalance>;
  getStreakData(userId: string): Promise<Streak>;
  getLeaderboard(timeframe: LeaderboardTimeframe, limit?: number): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
  getAchievements(userId: string): Promise<Achievement[]>;
}
