/**
 * Achievement definitions (spec-aligned). Stub: used for locked/unlocked display.
 * Production: AchievementType PDAs on-chain; each award = AchievementReceipt + soulbound Core NFT.
 */

export interface AchievementDefinition {
  id: number;
  name: string;
  category: 'progress' | 'streak' | 'skills' | 'community' | 'special';
  xpReward: number;
  description: string;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 1, name: 'First Steps', category: 'progress', xpReward: 25, description: 'Complete your first lesson' },
  { id: 2, name: 'Course Completer', category: 'progress', xpReward: 200, description: 'Complete a full course' },
  { id: 3, name: 'Speed Runner', category: 'progress', xpReward: 50, description: 'Complete 5 lessons in one day' },
  { id: 4, name: 'Week Warrior', category: 'streak', xpReward: 75, description: '7-day streak' },
  { id: 5, name: 'Monthly Master', category: 'streak', xpReward: 150, description: '30-day streak' },
  { id: 6, name: 'Consistency King', category: 'streak', xpReward: 300, description: '100-day streak' },
  { id: 7, name: 'Rust Rookie', category: 'skills', xpReward: 100, description: 'Complete Rust basics' },
  { id: 8, name: 'Anchor Expert', category: 'skills', xpReward: 150, description: 'Complete Anchor track' },
  { id: 9, name: 'Full Stack Solana', category: 'skills', xpReward: 250, description: 'Complete all tracks' },
  { id: 10, name: 'Early Adopter', category: 'special', xpReward: 50, description: 'Joined in the first 30 days' },
];
