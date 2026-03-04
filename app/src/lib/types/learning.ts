import type { PublicKey } from "@solana/web3.js";

// ------------------------------------------------------------------
// Domain Types
// ------------------------------------------------------------------

export interface Progress {
  courseId: string;
  userId: string;
  lessonProgress: number; // bitmap
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  startedAt: string;
  completedAt: string | null;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakHistory: { date: string; active: boolean }[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  currentStreak: number;
  rank: number;
}

export interface Credential {
  mintAddress: string;
  trackName: string;
  level: number;
  imageUrl: string;
  metadata: Record<string, string>;
  verifyUrl: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  category: "progress" | "streaks" | "skills" | "community" | "special";
  icon: string;
  unlockedAt: string | null;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  lessonProgress: number;
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  startedAt: string;
  completedAt: string | null;
}

export interface XPEvent {
  id: string;
  amount: number;
  reason: string;
  courseId: string | null;
  lessonIndex: number | null;
  createdAt: string;
}

export interface UserXPSummary {
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  achievements: number; // bitmap
}

// ------------------------------------------------------------------
// Helper: XP to Level formula from spec
// Level = floor(sqrt(xp / 100))
// ------------------------------------------------------------------

export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function levelToMinXp(level: number): number {
  return level * level * 100;
}

export function xpToNextLevel(xp: number): number {
  const currentLevel = xpToLevel(xp);
  const nextLevelXp = levelToMinXp(currentLevel + 1);
  return nextLevelXp - xp;
}

export function levelProgress(xp: number): number {
  const currentLevel = xpToLevel(xp);
  const currentLevelXp = levelToMinXp(currentLevel);
  const nextLevelXp = levelToMinXp(currentLevel + 1);
  if (nextLevelXp === currentLevelXp) return 100;
  return ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
}

// ------------------------------------------------------------------
// Service Interface (from spec)
// ------------------------------------------------------------------

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress | null>;
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
    xpAmount: number,
    context?: { onChainCourseId?: string }
  ): Promise<void>;
  getXP(userId: string): Promise<UserXPSummary>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime"
  ): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
  getEnrollments(userId: string): Promise<Enrollment[]>;
  enroll(
    userId: string,
    courseId: string,
    meta: {
      courseTitle: string;
      courseSlug: string;
      totalLessons: number;
      onChainCourseId?: string;
      skipOnChainBridge?: boolean;
    }
  ): Promise<void>;
  closeEnrollment(
    userId: string,
    courseId: string,
    context?: {
      onChainCourseId?: string;
      skipOnChainBridge?: boolean;
    }
  ): Promise<void>;
  getAchievements(userId: string): Promise<Achievement[]>;
}

// ------------------------------------------------------------------
// XP Reward Config
// ------------------------------------------------------------------

export const XP_REWARDS = {
  COMPLETE_LESSON_EASY: 10,
  COMPLETE_LESSON_MEDIUM: 25,
  COMPLETE_LESSON_HARD: 50,
  COMPLETE_CHALLENGE_EASY: 25,
  COMPLETE_CHALLENGE_MEDIUM: 50,
  COMPLETE_CHALLENGE_HARD: 100,
  COMPLETE_COURSE: 500,
  DAILY_STREAK_BONUS: 10,
  FIRST_COMPLETION_OF_DAY: 25,
} as const;

// ------------------------------------------------------------------
// Achievement definitions (up to 256 from spec)
// ------------------------------------------------------------------

export const ACHIEVEMENTS: Achievement[] = [
  // Progress
  { id: 0, name: "First Steps", description: "Complete your first lesson", category: "progress", icon: "footprints", unlockedAt: null },
  { id: 1, name: "Course Completer", description: "Complete an entire course", category: "progress", icon: "graduation-cap", unlockedAt: null },
  { id: 2, name: "Speed Runner", description: "Complete a course in under 24 hours", category: "progress", icon: "timer", unlockedAt: null },
  { id: 3, name: "Knowledge Seeker", description: "Enroll in 5 courses", category: "progress", icon: "book-open", unlockedAt: null },
  { id: 4, name: "Halfway There", description: "Reach 50% on any course", category: "progress", icon: "milestone", unlockedAt: null },

  // Streaks
  { id: 10, name: "Week Warrior", description: "Maintain a 7-day streak", category: "streaks", icon: "flame", unlockedAt: null },
  { id: 11, name: "Monthly Master", description: "Maintain a 30-day streak", category: "streaks", icon: "flame-kindling", unlockedAt: null },
  { id: 12, name: "Consistency King", description: "Maintain a 100-day streak", category: "streaks", icon: "crown", unlockedAt: null },

  // Skills
  { id: 20, name: "Rust Rookie", description: "Complete a Rust fundamentals course", category: "skills", icon: "code", unlockedAt: null },
  { id: 21, name: "Anchor Expert", description: "Complete the Anchor Development track", category: "skills", icon: "anchor", unlockedAt: null },
  { id: 22, name: "Full Stack Solana", description: "Complete courses spanning frontend, backend, and on-chain", category: "skills", icon: "layers", unlockedAt: null },
  { id: 23, name: "DeFi Builder", description: "Complete a DeFi protocol course", category: "skills", icon: "coins", unlockedAt: null },
  { id: 24, name: "Security Auditor", description: "Complete a security & auditing course", category: "skills", icon: "shield", unlockedAt: null },

  // Community
  { id: 30, name: "Helper", description: "Help another learner in the community", category: "community", icon: "heart-handshake", unlockedAt: null },
  { id: 31, name: "Top Contributor", description: "Be in the top 10 on the leaderboard", category: "community", icon: "trophy", unlockedAt: null },

  // Special
  { id: 40, name: "Early Adopter", description: "Join during the launch phase", category: "special", icon: "rocket", unlockedAt: null },
  { id: 41, name: "Bug Hunter", description: "Report a valid bug", category: "special", icon: "bug", unlockedAt: null },
  { id: 42, name: "Perfect Score", description: "Complete all challenges in a course with 100%", category: "special", icon: "star", unlockedAt: null },
];
