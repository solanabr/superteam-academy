/**
 * Service interfaces for Superteam Academy LMS
 * 
 * These clean abstractions allow swapping between local/mock implementations
 * and on-chain Solana program calls. The on-chain program at
 * github.com/solanabr/superteam-academy handles XP (soulbound Token-2022),
 * credentials (evolving cNFTs via Bubblegum), enrollments, and achievements.
 */

import { PublicKey } from '@solana/web3.js';

// ─── Core Types ──────────────────────────────────────────────────────────────

export interface Progress {
  courseId: string;
  userId: string;
  completedLessons: number[];  // bitmap-style lesson indices
  totalLessons: number;
  percentComplete: number;
  lastAccessedAt: Date;
  enrolledAt: Date;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;  // ISO date
  streakHistory: string[];   // ISO dates with activity
  streakFreezes: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
  wallet?: string;
}

export interface Credential {
  mint: string;           // cNFT mint address
  courseTrack: string;
  level: number;
  name: string;
  imageUri: string;
  issuedAt: Date;
  verificationUrl: string;  // Solana Explorer link
  metadata: Record<string, unknown>;
}

export interface Achievement {
  id: number;             // 0-255 (bitmap index)
  name: string;
  description: string;
  category: 'progress' | 'streaks' | 'skills' | 'community' | 'special';
  icon: string;
  unlockedAt?: Date;
  xpReward: number;
}

export interface UserProfile {
  id: string;
  wallet?: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
  joinedAt: Date;
  isPublic: boolean;
  skills: Record<string, number>;  // skill name -> proficiency 0-100
  authMethods: ('wallet' | 'google' | 'github')[];
}

export interface EnrollmentData {
  courseId: string;
  userId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'dropped';
  xpEarned: number;
}

export interface XPEvent {
  type: 'lesson_complete' | 'challenge_complete' | 'course_complete' | 'streak_bonus' | 'first_daily';
  amount: number;
  courseId?: string;
  lessonIndex?: number;
  timestamp: Date;
}

// ─── Service Interfaces ──────────────────────────────────────────────────────

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  getAllProgress(userId: string): Promise<Progress[]>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getLevel(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
}

export interface EnrollmentService {
  enroll(userId: string, courseId: string): Promise<EnrollmentData>;
  unenroll(userId: string, courseId: string): Promise<void>;
  getEnrollment(userId: string, courseId: string): Promise<EnrollmentData | null>;
  getEnrollments(userId: string): Promise<EnrollmentData[]>;
  isEnrolled(userId: string, courseId: string): Promise<boolean>;
}

export interface AchievementService {
  getAchievements(userId: string): Promise<Achievement[]>;
  getUnlockedAchievements(userId: string): Promise<Achievement[]>;
  checkAndUnlock(userId: string): Promise<Achievement[]>;  // returns newly unlocked
  getAchievementProgress(userId: string, achievementId: number): Promise<number>;  // 0-100%
}

export interface UserProfileService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  linkAuthMethod(userId: string, method: 'wallet' | 'google' | 'github', credential: string): Promise<void>;
  unlinkAuthMethod(userId: string, method: 'wallet' | 'google' | 'github'): Promise<void>;
}

export interface CredentialService {
  mintCredential(wallet: PublicKey, courseId: string): Promise<Credential>;
  getCredential(mint: string): Promise<Credential | null>;
  upgradeCredential(mint: string, newLevel: number): Promise<Credential>;
  verifyCredential(mint: string): Promise<boolean>;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/** XP to Level: Level = floor(sqrt(xp / 100)) */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/** Level to minimum XP required */
export function levelToXP(level: number): number {
  return level * level * 100;
}

/** XP progress within current level (0-100%) */
export function levelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const currentLevelXP = levelToXP(currentLevel);
  const nextLevelXP = levelToXP(currentLevel + 1);
  return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}
