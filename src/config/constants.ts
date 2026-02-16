import { LearningTrack } from '@/types';

// Re-export TRACK_INFO from types for convenience
export { TRACK_INFO } from '@/types';

// ============================================
// App Configuration
// ============================================

export const APP_CONFIG = {
  name: 'Solana Quest',
  tagline: 'Your Adventure into Solana Development',
  description: 'An RPG-themed learning platform that transforms Solana development education into an epic quest. Level up your skills, earn on-chain credentials, and join the builder community.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://solana-quest.vercel.app',
  github: 'https://github.com/solanabr/superteam-academy',
  twitter: '@SuperteamBR',
  discord: 'https://discord.gg/superteambrasil',
} as const;

// ============================================
// Solana Configuration
// ============================================

export const SOLANA_CONFIG = {
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta',
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  programId: process.env.NEXT_PUBLIC_PROGRAM_ID || '',
  xpMintAddress: process.env.NEXT_PUBLIC_XP_MINT_ADDRESS || '',
} as const;

// ============================================
// XP & Leveling System
// ============================================

export const XP_CONFIG = {
  /** XP for completing a lesson (varies by difficulty) */
  lessonComplete: {
    beginner: 10,
    intermediate: 25,
    advanced: 40,
    legendary: 50,
  },
  /** XP for completing a code challenge */
  challengeComplete: {
    easy: 25,
    medium: 50,
    hard: 75,
    boss: 100,
  },
  /** XP for completing an entire course */
  courseComplete: {
    beginner: 500,
    intermediate: 1000,
    advanced: 1500,
    legendary: 2000,
  },
  /** Daily streak bonus */
  dailyStreakBonus: 10,
  /** First completion of the day */
  firstDailyCompletion: 25,
  /** Calculate level from XP: Level = floor(sqrt(xp / 100)) */
  calculateLevel: (xp: number): number => Math.floor(Math.sqrt(xp / 100)),
  /** Calculate XP needed for next level */
  xpForLevel: (level: number): number => level * level * 100,
  /** Calculate progress to next level (0-100) */
  levelProgress: (xp: number): number => {
    const currentLevel = Math.floor(Math.sqrt(xp / 100));
    const currentLevelXP = currentLevel * currentLevel * 100;
    const nextLevelXP = (currentLevel + 1) * (currentLevel + 1) * 100;
    return Math.round(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);
  },
} as const;

// ============================================
// Streak Milestones
// ============================================

export const STREAK_MILESTONES = [
  { days: 3, title: 'Getting Started', xpBonus: 25 },
  { days: 7, title: 'Week Warrior', xpBonus: 50 },
  { days: 14, title: 'Fortnight Fighter', xpBonus: 100 },
  { days: 30, title: 'Monthly Master', xpBonus: 250 },
  { days: 60, title: 'Dedicated Developer', xpBonus: 500 },
  { days: 100, title: 'Consistency King', xpBonus: 1000 },
  { days: 365, title: 'Legendary Learner', xpBonus: 5000 },
] as const;

// ============================================
// Achievement Definitions
// ============================================

export const ACHIEVEMENTS = {
  // Progress
  FIRST_LESSON: { id: 'first_lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '👣', category: 'progress' as const, rarity: 'common' as const },
  FIRST_COURSE: { id: 'first_course', name: 'Course Completer', description: 'Complete your first course', icon: '📜', category: 'progress' as const, rarity: 'rare' as const },
  FIVE_COURSES: { id: 'five_courses', name: 'Knowledge Seeker', description: 'Complete 5 courses', icon: '📚', category: 'progress' as const, rarity: 'epic' as const },
  SPEED_RUNNER: { id: 'speed_runner', name: 'Speed Runner', description: 'Complete a course in under 24 hours', icon: '⚡', category: 'progress' as const, rarity: 'epic' as const },

  // Streaks
  WEEK_WARRIOR: { id: 'week_warrior', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak' as const, rarity: 'common' as const },
  MONTHLY_MASTER: { id: 'monthly_master', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🌟', category: 'streak' as const, rarity: 'rare' as const },
  CONSISTENCY_KING: { id: 'consistency_king', name: 'Consistency King', description: 'Maintain a 100-day streak', icon: '👑', category: 'streak' as const, rarity: 'legendary' as const },

  // Skills
  RUST_ROOKIE: { id: 'rust_rookie', name: 'Rust Rookie', description: 'Complete your first Rust lesson', icon: '🦀', category: 'skill' as const, rarity: 'common' as const },
  ANCHOR_EXPERT: { id: 'anchor_expert', name: 'Anchor Expert', description: 'Complete all Anchor courses', icon: '⚓', category: 'skill' as const, rarity: 'epic' as const },
  FULLSTACK_SOLANA: { id: 'fullstack_solana', name: 'Full Stack Solana', description: 'Complete courses in all tracks', icon: '🚀', category: 'skill' as const, rarity: 'legendary' as const },

  // Special
  EARLY_ADOPTER: { id: 'early_adopter', name: 'Early Adopter', description: 'Join during the beta period', icon: '🌅', category: 'special' as const, rarity: 'legendary' as const },
  BUG_HUNTER: { id: 'bug_hunter', name: 'Bug Hunter', description: 'Report a verified bug', icon: '🐛', category: 'special' as const, rarity: 'rare' as const },
  PERFECT_SCORE: { id: 'perfect_score', name: 'Perfect Score', description: 'Complete a challenge on first try', icon: '💎', category: 'special' as const, rarity: 'epic' as const },
} as const;

// ============================================
// Level Titles
// ============================================

export const LEVEL_TITLES: Record<number, string> = {
  0: 'Novice',
  1: 'Apprentice',
  2: 'Initiate',
  3: 'Journeyman',
  4: 'Adept',
  5: 'Scholar',
  6: 'Expert',
  7: 'Master',
  8: 'Grandmaster',
  9: 'Legend',
  10: 'Mythic',
};

export function getLevelTitle(level: number): string {
  if (level >= 10) return LEVEL_TITLES[10];
  return LEVEL_TITLES[level] || LEVEL_TITLES[0];
}

// ============================================
// Difficulty Config
// ============================================

export const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: '#14F195', icon: '🌱' },
  intermediate: { label: 'Intermediate', color: '#00D1FF', icon: '⚔️' },
  advanced: { label: 'Advanced', color: '#9945FF', icon: '🔮' },
  legendary: { label: 'Legendary', color: '#F0B90B', icon: '👑' },
} as const;

// ============================================
// Navigation
// ============================================

export const NAV_ITEMS = [
  { label: 'Quests', href: '/courses', icon: 'Scroll' },
  { label: 'Leaderboard', href: '/leaderboard', icon: 'Trophy' },
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const;
