import { PublicKey } from '@solana/web3.js';

// ============================================
// Core Learning Types
// ============================================

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'legendary';
  duration: string;
  totalXP: number;
  track: LearningTrack;
  modules: Module[];
  instructor: Instructor;
  tags: string[];
  enrollmentCount: number;
  rating: number;
  language: string;
  prerequisites: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  xpReward: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'content' | 'challenge' | 'video' | 'quiz';
  order: number;
  content: string;
  xpReward: number;
  duration: string;
  challenge?: CodeChallenge;
}

export interface CodeChallenge {
  id: string;
  title: string;
  description: string;
  prompt: string;
  starterCode: string;
  solution: string;
  language: 'rust' | 'typescript' | 'json';
  testCases: TestCase[];
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'boss';
  xpReward: number;
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  title: string;
  socialLinks: SocialLinks;
}

export interface SocialLinks {
  twitter?: string;
  github?: string;
  website?: string;
}

// ============================================
// Learning Tracks (Quest Lines)
// ============================================

export type LearningTrack =
  | 'solana-fundamentals'
  | 'rust-mastery'
  | 'anchor-development'
  | 'defi-builder'
  | 'nft-creator'
  | 'security-auditor'
  | 'fullstack-solana';

export const TRACK_INFO: Record<LearningTrack, { name: string; icon: string; color: string; description: string }> = {
  'solana-fundamentals': {
    name: 'Solana Fundamentals',
    icon: '⚡',
    color: '#9945FF',
    description: 'Master the foundations of the Solana blockchain',
  },
  'rust-mastery': {
    name: 'Rust Mastery',
    icon: '🦀',
    color: '#FF6B35',
    description: 'Become proficient in Rust for blockchain development',
  },
  'anchor-development': {
    name: 'Anchor Development',
    icon: '⚓',
    color: '#00D1FF',
    description: 'Build Solana programs with the Anchor framework',
  },
  'defi-builder': {
    name: 'DeFi Builder',
    icon: '💰',
    color: '#14F195',
    description: 'Create decentralized finance applications',
  },
  'nft-creator': {
    name: 'NFT Creator',
    icon: '🎨',
    color: '#E42575',
    description: 'Design and deploy NFT collections and marketplaces',
  },
  'security-auditor': {
    name: 'Security Auditor',
    icon: '🛡️',
    color: '#F0B90B',
    description: 'Audit smart contracts and find vulnerabilities',
  },
  'fullstack-solana': {
    name: 'Full Stack Solana',
    icon: '🚀',
    color: '#9945FF',
    description: 'Build complete dApps from frontend to on-chain',
  },
};

// ============================================
// User & Gamification Types
// ============================================

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  walletAddress?: string;
  googleId?: string;
  githubId?: string;
  joinedAt: string;
  socialLinks: SocialLinks;
  preferences: UserPreferences;
  isPublic: boolean;
}

export interface UserPreferences {
  language: 'en' | 'pt-BR' | 'es';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

export interface GamificationProfile {
  userId: string;
  xp: number;
  level: number;
  rank: number;
  streak: StreakData;
  achievements: Achievement[];
  unlockedAchievementBitmap: number;
  skills: SkillNode[];
  title: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakHistory: string[];
  hasFreezeAvailable: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'progress' | 'streak' | 'skill' | 'community' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface SkillNode {
  id: string;
  name: string;
  track: LearningTrack;
  level: number;
  maxLevel: number;
  xp: number;
  xpRequired: number;
  dependencies: string[];
  isUnlocked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  title: string;
}

// ============================================
// Progress Tracking
// ============================================

export interface Progress {
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedLessons: number[];
  totalLessons: number;
  currentModule: number;
  currentLesson: number;
  xpEarned: number;
  completionPercentage: number;
  completedAt?: string;
}

// ============================================
// On-Chain / Credential Types
// ============================================

export interface Credential {
  mintAddress: string;
  track: LearningTrack;
  level: number;
  coursesCompleted: number;
  totalXP: number;
  metadata: CredentialMetadata;
  verificationUrl: string;
}

export interface CredentialMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// ============================================
// Service Interfaces (Clean abstractions)
// ============================================

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
}

export interface CourseService {
  getCourses(filters?: CourseFilters): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  getLesson(courseSlug: string, lessonId: string): Promise<Lesson | null>;
  searchCourses(query: string): Promise<Course[]>;
}

export interface GamificationService {
  getProfile(userId: string): Promise<GamificationProfile>;
  getAchievements(userId: string): Promise<Achievement[]>;
  getSkillTree(userId: string): Promise<SkillNode[]>;
  claimAchievement(userId: string, achievementId: string): Promise<void>;
}

export interface AuthService {
  signInWithWallet(walletAddress: string): Promise<User>;
  signInWithGoogle(): Promise<User>;
  signInWithGithub(): Promise<User>;
  linkWallet(userId: string, walletAddress: string): Promise<void>;
  linkGoogle(userId: string): Promise<void>;
  linkGithub(userId: string): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

// ============================================
// Filter & Search Types
// ============================================

export interface CourseFilters {
  difficulty?: Course['difficulty'];
  track?: LearningTrack;
  search?: string;
  duration?: 'short' | 'medium' | 'long';
  sortBy?: 'popular' | 'newest' | 'difficulty' | 'rating';
}

// ============================================
// Analytics Events
// ============================================

export type AnalyticsEvent =
  | { type: 'page_view'; page: string }
  | { type: 'course_view'; courseId: string }
  | { type: 'lesson_start'; courseId: string; lessonId: string }
  | { type: 'lesson_complete'; courseId: string; lessonId: string; xpEarned: number }
  | { type: 'challenge_attempt'; challengeId: string; success: boolean }
  | { type: 'achievement_unlock'; achievementId: string }
  | { type: 'wallet_connect'; walletType: string }
  | { type: 'sign_in'; method: 'wallet' | 'google' | 'github' };
