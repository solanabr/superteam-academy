/**
 * Gamification Types
 * XP, Levels, Streaks, and Achievements for the Superteam Brazil LMS
 */

// ==================== XP & Leveling ====================

export interface XPBalance {
  total: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  type: XPTransactionType;
  source: string; // e.g., "lesson:lesson-001", "course:solana-fundamentals"
  description: string;
  createdAt: Date;
}

export type XPTransactionType =
  | 'lesson_complete'
  | 'challenge_complete'
  | 'course_complete'
  | 'streak_bonus'
  | 'daily_first'
  | 'achievement'
  | 'bonus';

// XP Rewards Configuration
export const XP_REWARDS = {
  LESSON_COMPLETE_MIN: 10,
  LESSON_COMPLETE_MAX: 50,
  CHALLENGE_COMPLETE_MIN: 25,
  CHALLENGE_COMPLETE_MAX: 100,
  COURSE_COMPLETE_MIN: 500,
  COURSE_COMPLETE_MAX: 2000,
  DAILY_STREAK_BONUS: 10,
  FIRST_COMPLETION_OF_DAY: 25,
} as const;

// Difficulty levels for XP calculation
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Calculate XP reward for a lesson based on difficulty
 * Beginner: 10-20 XP
 * Intermediate: 25-35 XP
 * Advanced: 40-50 XP
 */
export function calculateLessonXP(difficulty: DifficultyLevel = 'intermediate'): number {
  switch (difficulty) {
    case 'beginner':
      return 15; // Middle of 10-20 range
    case 'intermediate':
      return 30; // Middle of 25-35 range
    case 'advanced':
      return 45; // Middle of 40-50 range
    default:
      return XP_REWARDS.LESSON_COMPLETE_MIN;
  }
}

/**
 * Calculate XP reward for a challenge based on difficulty
 * Beginner: 25-40 XP
 * Intermediate: 50-70 XP
 * Advanced: 80-100 XP
 */
export function calculateChallengeXP(difficulty: DifficultyLevel = 'intermediate'): number {
  switch (difficulty) {
    case 'beginner':
      return 30; // Middle of 25-40 range
    case 'intermediate':
      return 60; // Middle of 50-70 range
    case 'advanced':
      return 90; // Middle of 80-100 range
    default:
      return XP_REWARDS.CHALLENGE_COMPLETE_MIN;
  }
}

/**
 * Calculate XP reward for course completion based on difficulty and lesson count
 * Base values scaled by number of lessons
 */
export function calculateCourseXP(
  difficulty: DifficultyLevel = 'intermediate',
  lessonCount: number = 10
): number {
  const baseMultiplier = difficulty === 'beginner' ? 50 : difficulty === 'advanced' ? 150 : 100;
  const calculatedXP = baseMultiplier * Math.log2(lessonCount + 1);

  // Ensure within min-max range
  return Math.max(
    XP_REWARDS.COURSE_COMPLETE_MIN,
    Math.min(Math.round(calculatedXP), XP_REWARDS.COURSE_COMPLETE_MAX)
  );
}

// ==================== Streaks ====================

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // ISO date string (YYYY-MM-DD)
  streakHistory: StreakDay[];
  streakFreezes: number;
  milestones: StreakMilestone[];
}

export interface StreakDay {
  date: string; // ISO date string (YYYY-MM-DD)
  hasActivity: boolean;
  xpEarned: number;
  lessonsCompleted: number;
}

export interface StreakMilestone {
  days: number;
  name: string;
  achieved: boolean;
  achievedAt?: string;
  xpReward: number;
}

export const STREAK_MILESTONES = [
  { days: 7, name: 'Week Warrior', xpReward: 100 },
  { days: 14, name: 'Two Week Champion', xpReward: 200 },
  { days: 30, name: 'Monthly Master', xpReward: 500 },
  { days: 60, name: 'Two Month Titan', xpReward: 1000 },
  { days: 100, name: 'Consistency King', xpReward: 2000 },
  { days: 365, name: 'Yearly Legend', xpReward: 10000 },
] as const;

// ==================== Achievements ====================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xpReward: number;
  rarity: AchievementRarity;
  criteria: AchievementCriteria;
  maxSupply?: number; // Optional supply cap
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
  nftMintAddress?: string; // For on-chain achievements
}

export type AchievementCategory = 'progress' | 'streaks' | 'skills' | 'community' | 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementCriteria {
  type: AchievementCriteriaType;
  value: number;
  metadata?: Record<string, unknown>;
}

export type AchievementCriteriaType =
  | 'lessons_completed'
  | 'courses_completed'
  | 'challenges_completed'
  | 'community_posts'
  | 'community_comments'
  | 'community_likes'
  | 'xp_earned'
  | 'level_reached'
  | 'streak_days'
  | 'first_lesson'
  | 'first_course'
  | 'perfect_score'
  | 'speed_run' // Complete course under time limit
  | 'early_adopter'
  | 'bug_hunter';

// Predefined Achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Progress Achievements
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    category: 'progress',
    icon: 'target',
    xpReward: 50,
    rarity: 'common',
    criteria: { type: 'lessons_completed', value: 1 },
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Complete 5 lessons',
    category: 'progress',
    icon: 'book-open',
    xpReward: 100,
    rarity: 'common',
    criteria: { type: 'lessons_completed', value: 5 },
  },
  {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Complete 25 lessons',
    category: 'progress',
    icon: 'graduation-cap',
    xpReward: 250,
    rarity: 'uncommon',
    criteria: { type: 'lessons_completed', value: 25 },
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Complete 100 lessons',
    category: 'progress',
    icon: 'brain',
    xpReward: 1000,
    rarity: 'rare',
    criteria: { type: 'lessons_completed', value: 100 },
  },
  {
    id: 'course-completer',
    name: 'Course Completer',
    description: 'Complete your first course',
    category: 'progress',
    icon: 'trophy',
    xpReward: 200,
    rarity: 'uncommon',
    criteria: { type: 'courses_completed', value: 1 },
  },
  {
    id: 'triple-threat',
    name: 'Triple Threat',
    description: 'Complete 3 courses',
    category: 'progress',
    icon: 'target',
    xpReward: 500,
    rarity: 'rare',
    criteria: { type: 'courses_completed', value: 3 },
  },
  {
    id: 'speed-runner',
    name: 'Speed Runner',
    description: 'Complete a course in under 24 hours',
    category: 'progress',
    icon: 'zap',
    xpReward: 300,
    rarity: 'rare',
    criteria: { type: 'speed_run', value: 24 },
  },

  // Streak Achievements
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'streaks',
    icon: 'flame',
    xpReward: 100,
    rarity: 'common',
    criteria: { type: 'streak_days', value: 7 },
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    category: 'streaks',
    icon: 'star',
    xpReward: 500,
    rarity: 'rare',
    criteria: { type: 'streak_days', value: 30 },
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Maintain a 100-day streak',
    category: 'streaks',
    icon: 'crown',
    xpReward: 2000,
    rarity: 'legendary',
    criteria: { type: 'streak_days', value: 100 },
  },

  // Skills Achievements
  {
    id: 'rust-rookie',
    name: 'Rust Rookie',
    description: 'Complete your first Rust challenge',
    category: 'skills',
    icon: 'code',
    xpReward: 75,
    rarity: 'common',
    criteria: { type: 'challenges_completed', value: 1, metadata: { language: 'rust' } },
  },
  {
    id: 'anchor-expert',
    name: 'Anchor Expert',
    description: 'Complete all Anchor framework lessons',
    category: 'skills',
    icon: 'anchor',
    xpReward: 500,
    rarity: 'rare',
    criteria: { type: 'courses_completed', value: 1, metadata: { track: 'anchor' } },
  },
  {
    id: 'full-stack-solana',
    name: 'Full Stack Solana',
    description: 'Complete courses in all major tracks',
    category: 'skills',
    icon: 'rocket',
    xpReward: 2000,
    rarity: 'epic',
    criteria: { type: 'courses_completed', value: 5, metadata: { allTracks: true } },
  },

  // Community Achievements
  {
    id: 'helper',
    name: 'Helper',
    description: 'Create your first community post',
    category: 'community',
    icon: 'message-square',
    xpReward: 75,
    rarity: 'common',
    criteria: { type: 'community_posts', value: 1 },
  },
  {
    id: 'first-comment',
    name: 'First Comment',
    description: 'Post your first community comment',
    category: 'community',
    icon: 'message-circle',
    xpReward: 50,
    rarity: 'common',
    criteria: { type: 'community_comments', value: 1 },
  },
  {
    id: 'top-contributor',
    name: 'Top Contributor',
    description: 'Receive 10 likes across your community contributions',
    category: 'community',
    icon: 'thumbs-up',
    xpReward: 250,
    rarity: 'rare',
    criteria: { type: 'community_likes', value: 10 },
  },

  // Special Achievements
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Join during the platform launch',
    category: 'special',
    icon: 'sunrise',
    xpReward: 500,
    rarity: 'legendary',
    maxSupply: 1000,
    criteria: { type: 'early_adopter', value: 1 },
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Complete a challenge with 100% accuracy on first try',
    category: 'special',
    icon: 'award',
    xpReward: 150,
    rarity: 'uncommon',
    criteria: { type: 'perfect_score', value: 1 },
  },
  {
    id: 'bug-hunter',
    name: 'Bug Hunter',
    description: 'Report a valid bug in the platform',
    category: 'special',
    icon: 'bug',
    xpReward: 500,
    rarity: 'epic',
    criteria: { type: 'bug_hunter', value: 1 },
  },
];

// ==================== Leaderboard ====================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
  coursesCompleted: number;
}

export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'all-time';

export interface LeaderboardData {
  timeframe: LeaderboardTimeframe;
  entries: LeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
  lastUpdated: Date;
}

// ==================== User Gamification Profile ====================

export interface UserGamificationProfile {
  userId: string;
  xp: XPBalance;
  streak: StreakData;
  achievements: UserAchievement[];
  stats: UserStats;
}

export interface UserStats {
  lessonsCompleted: number;
  coursesCompleted: number;
  challengesCompleted: number;
  totalTimeSpent: number; // in minutes
  averageScore: number;
  joinedAt: Date;
}

// ==================== Utility Functions ====================

/**
 * Calculate level from total XP
 * Level = floor(sqrt(totalXP / 100))
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

/**
 * Calculate XP needed for a specific level
 * XP = level^2 * 100
 */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/**
 * Get XP balance details from total XP
 */
export function getXPBalance(totalXP: number): XPBalance {
  const level = calculateLevel(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const progressInLevel = totalXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercent = Math.round((progressInLevel / xpNeededForNextLevel) * 100);

  return {
    total: totalXP,
    level,
    currentLevelXp: currentLevelXP,
    nextLevelXp: nextLevelXP,
    progressPercent: Math.min(progressPercent, 100),
  };
}

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'common':
      return 'text-gray-500 bg-gray-500/10';
    case 'uncommon':
      return 'text-green-500 bg-green-500/10';
    case 'rare':
      return 'text-blue-500 bg-blue-500/10';
    case 'epic':
      return 'text-purple-500 bg-purple-500/10';
    case 'legendary':
      return 'text-yellow-500 bg-yellow-500/10';
    default:
      return 'text-gray-500 bg-gray-500/10';
  }
}

/**
 * Check if streak is active (activity within last 24 hours)
 */
export function isStreakActive(lastActivityDate: string | null): boolean {
  if (!lastActivityDate) return false;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return lastActivityDate === today || lastActivityDate === yesterday;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
