import { connectToDatabase } from '@/lib/mongodb';
import { UserAchievement, IUserAchievement } from '@/models/UserAchievement';
import { UserProgress } from '@/models/UserProgress';
import { UserStreak } from '@/models/UserStreak';
import { CourseEnrollment } from '@/models/CourseEnrollment';
import { User } from '@/models/User';
import mongoose from 'mongoose';

/**
 * Achievement Service
 * Handles achievement definitions, progress tracking, and unlocking
 */

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xpReward: number;
  rarity: AchievementRarity;
  criteria: AchievementCriteria;
  isSecret?: boolean;
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
  | 'xp_earned'
  | 'level_reached'
  | 'streak_days'
  | 'first_lesson'
  | 'first_course'
  | 'perfect_challenge'
  | 'speed_completion'
  | 'early_adopter';

export interface UserAchievementData {
  achievement: AchievementDefinition;
  earned: boolean;
  earnedAt?: Date;
  progress: number;
  nftMintAddress?: string;
}

export interface AchievementUnlockResult {
  achievement: AchievementDefinition;
  xpAwarded: number;
  isNew: boolean;
}

// Achievement definitions
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Progress Achievements
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    category: 'progress',
    icon: 'target',
    xpReward: 50,
    rarity: 'common',
    criteria: { type: 'first_lesson', value: 1 },
  },
  {
    id: 'lesson-master-5',
    name: 'Getting Warmed Up',
    description: 'Complete 5 lessons',
    category: 'progress',
    icon: 'book-open',
    xpReward: 100,
    rarity: 'common',
    criteria: { type: 'lessons_completed', value: 5 },
  },
  {
    id: 'lesson-master-25',
    name: 'Dedicated Learner',
    description: 'Complete 25 lessons',
    category: 'progress',
    icon: 'graduation-cap',
    xpReward: 250,
    rarity: 'uncommon',
    criteria: { type: 'lessons_completed', value: 25 },
  },
  {
    id: 'lesson-master-100',
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
    criteria: { type: 'first_course', value: 1 },
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
    id: 'course-champion',
    name: 'Course Champion',
    description: 'Complete 10 courses',
    category: 'progress',
    icon: 'crown',
    xpReward: 2000,
    rarity: 'epic',
    criteria: { type: 'courses_completed', value: 10 },
  },

  // Challenge Achievements
  {
    id: 'challenge-beginner',
    name: 'Code Warrior',
    description: 'Complete 5 coding challenges',
    category: 'skills',
    icon: 'shield',
    xpReward: 100,
    rarity: 'common',
    criteria: { type: 'challenges_completed', value: 5 },
  },
  {
    id: 'challenge-intermediate',
    name: 'Code Master',
    description: 'Complete 25 coding challenges',
    category: 'skills',
    icon: 'code',
    xpReward: 500,
    rarity: 'uncommon',
    criteria: { type: 'challenges_completed', value: 25 },
  },
  {
    id: 'challenge-expert',
    name: 'Code Legend',
    description: 'Complete 100 coding challenges',
    category: 'skills',
    icon: 'rocket',
    xpReward: 2000,
    rarity: 'rare',
    criteria: { type: 'challenges_completed', value: 100 },
  },

  // Streak Achievements
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    category: 'streaks',
    icon: 'flame',
    xpReward: 25,
    rarity: 'common',
    criteria: { type: 'streak_days', value: 3 },
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'streaks',
    icon: 'flame',
    xpReward: 100,
    rarity: 'uncommon',
    criteria: { type: 'streak_days', value: 7 },
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    category: 'streaks',
    icon: 'star',
    xpReward: 500,
    rarity: 'rare',
    criteria: { type: 'streak_days', value: 30 },
  },
  {
    id: 'streak-100',
    name: 'Consistency King',
    description: 'Maintain a 100-day streak',
    category: 'streaks',
    icon: 'trophy',
    xpReward: 2000,
    rarity: 'epic',
    criteria: { type: 'streak_days', value: 100 },
  },
  {
    id: 'streak-365',
    name: 'Yearly Legend',
    description: 'Maintain a 365-day streak',
    category: 'streaks',
    icon: 'award',
    xpReward: 10000,
    rarity: 'legendary',
    criteria: { type: 'streak_days', value: 365 },
  },

  // XP Achievements
  {
    id: 'xp-1000',
    name: 'Rising Star',
    description: 'Earn 1,000 XP',
    category: 'progress',
    icon: 'star',
    xpReward: 100,
    rarity: 'common',
    criteria: { type: 'xp_earned', value: 1000 },
  },
  {
    id: 'xp-10000',
    name: 'XP Hunter',
    description: 'Earn 10,000 XP',
    category: 'progress',
    icon: 'star',
    xpReward: 500,
    rarity: 'uncommon',
    criteria: { type: 'xp_earned', value: 10000 },
  },
  {
    id: 'xp-100000',
    name: 'XP Legend',
    description: 'Earn 100,000 XP',
    category: 'progress',
    icon: 'sparkles',
    xpReward: 5000,
    rarity: 'epic',
    criteria: { type: 'xp_earned', value: 100000 },
  },

  // Level Achievements
  {
    id: 'level-5',
    name: 'Level Up',
    description: 'Reach level 5',
    category: 'progress',
    icon: 'trending',
    xpReward: 100,
    rarity: 'common',
    criteria: { type: 'level_reached', value: 5 },
  },
  {
    id: 'level-10',
    name: 'Double Digits',
    description: 'Reach level 10',
    category: 'progress',
    icon: 'award',
    xpReward: 250,
    rarity: 'uncommon',
    criteria: { type: 'level_reached', value: 10 },
  },
  {
    id: 'level-25',
    name: 'Quarter Century',
    description: 'Reach level 25',
    category: 'progress',
    icon: 'award',
    xpReward: 1000,
    rarity: 'rare',
    criteria: { type: 'level_reached', value: 25 },
  },
  {
    id: 'level-50',
    name: 'Half Century',
    description: 'Reach level 50',
    category: 'progress',
    icon: 'trophy',
    xpReward: 5000,
    rarity: 'epic',
    criteria: { type: 'level_reached', value: 50 },
  },

  // Special Achievements
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'One of the first 1000 users',
    category: 'special',
    icon: 'sprout',
    xpReward: 500,
    rarity: 'rare',
    criteria: { type: 'early_adopter', value: 1000 },
    isSecret: true,
  },
];

export class AchievementService {
  /**
   * Get all achievements with user progress
   */
  static async getUserAchievements(userId: string): Promise<UserAchievementData[]> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch user's earned achievements
    const earnedAchievements = await UserAchievement.find({ user_id: userObjectId });
    const earnedMap = new Map(earnedAchievements.map((a) => [a.achievement_id, a]));

    // Fetch user stats for progress calculation
    const stats = await this.getUserStats(userId);

    // Build achievement data with progress
    return ACHIEVEMENTS.map((achievement) => {
      const earned = earnedMap.get(achievement.id);
      const progress = this.calculateProgress(achievement, stats);

      return {
        achievement,
        earned: !!earned,
        earnedAt: earned?.earned_at,
        progress,
        nftMintAddress: undefined, // TODO: Link to on-chain credential
      };
    });
  }

  /**
   * Check and unlock achievements for a user
   */
  static async checkAndUnlockAchievements(userId: string): Promise<AchievementUnlockResult[]> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get already earned achievements
    const earnedAchievements = await UserAchievement.find({ user_id: userObjectId });
    const earnedIds = new Set(earnedAchievements.map((a) => a.achievement_id));

    // Get user stats
    const stats = await this.getUserStats(userId);

    // Check each non-earned achievement
    const newlyUnlocked: AchievementUnlockResult[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (earnedIds.has(achievement.id)) continue;

      const earned = this.checkCriteria(achievement, stats);

      if (earned) {
        // Create achievement record
        await UserAchievement.create({
          user_id: userObjectId,
          achievement_id: achievement.id,
          achievement_name: achievement.name,
          achievement_description: achievement.description,
          achievement_icon: achievement.icon,
          xp_reward: achievement.xpReward,
          earned_at: new Date(),
        });

        newlyUnlocked.push({
          achievement,
          xpAwarded: achievement.xpReward,
          isNew: true,
        });
      }
    }

    return newlyUnlocked;
  }

  /**
   * Get user stats for achievement checking
   */
  private static async getUserStats(userId: string): Promise<{
    lessonsCompleted: number;
    coursesCompleted: number;
    challengesCompleted: number;
    totalXp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    userNumber: number;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get lesson completions
    const lessonsCompleted = await UserProgress.countDocuments({
      user_id: userObjectId,
      completed: true,
    });

    // Get challenge completions
    const challengesCompleted = await UserProgress.countDocuments({
      user_id: userObjectId,
      completed: true,
      'challenge_data.testsPassed': { $exists: true },
    });

    // Get course completions
    const coursesCompleted = await CourseEnrollment.countDocuments({
      user_id: userObjectId,
      completed_at: { $ne: null },
    });

    // Get user XP
    const user = await User.findById(userObjectId);
    const totalXp = user?.total_xp || 0;
    const level = Math.floor(Math.sqrt(totalXp / 100));

    // Get streak data
    const streak = await UserStreak.findOne({ user_id: userObjectId });
    const currentStreak = streak?.current_streak || 0;
    const longestStreak = streak?.longest_streak || 0;

    // Get user number (for early adopter)
    const userCount = await User.countDocuments();
    const userNumber = userCount;

    return {
      lessonsCompleted,
      coursesCompleted,
      challengesCompleted,
      totalXp,
      level,
      currentStreak,
      longestStreak,
      userNumber,
    };
  }

  /**
   * Calculate progress percentage for an achievement
   */
  private static calculateProgress(
    achievement: AchievementDefinition,
    stats: {
      lessonsCompleted: number;
      coursesCompleted: number;
      challengesCompleted: number;
      totalXp: number;
      level: number;
      longestStreak: number;
      userNumber: number;
    }
  ): number {
    let current = 0;
    const target = achievement.criteria.value;

    switch (achievement.criteria.type) {
      case 'lessons_completed':
      case 'first_lesson':
        current = stats.lessonsCompleted;
        break;
      case 'courses_completed':
      case 'first_course':
        current = stats.coursesCompleted;
        break;
      case 'challenges_completed':
        current = stats.challengesCompleted;
        break;
      case 'xp_earned':
        current = stats.totalXp;
        break;
      case 'level_reached':
        current = stats.level;
        break;
      case 'streak_days':
        current = stats.longestStreak;
        break;
      case 'early_adopter':
        current = stats.userNumber <= target ? target : 0;
        break;
      default:
        current = 0;
    }

    return Math.min(Math.round((current / target) * 100), 100);
  }

  /**
   * Check if achievement criteria is met
   */
  private static checkCriteria(
    achievement: AchievementDefinition,
    stats: {
      lessonsCompleted: number;
      coursesCompleted: number;
      challengesCompleted: number;
      totalXp: number;
      level: number;
      currentStreak: number;
      longestStreak: number;
      userNumber: number;
    }
  ): boolean {
    const value = achievement.criteria.value;

    switch (achievement.criteria.type) {
      case 'lessons_completed':
      case 'first_lesson':
        return stats.lessonsCompleted >= value;
      case 'courses_completed':
      case 'first_course':
        return stats.coursesCompleted >= value;
      case 'challenges_completed':
        return stats.challengesCompleted >= value;
      case 'xp_earned':
        return stats.totalXp >= value;
      case 'level_reached':
        return stats.level >= value;
      case 'streak_days':
        return stats.longestStreak >= value;
      case 'early_adopter':
        return stats.userNumber <= value;
      default:
        return false;
    }
  }

  /**
   * Get achievement by ID
   */
  static getAchievementById(achievementId: string): AchievementDefinition | undefined {
    return ACHIEVEMENTS.find((a) => a.id === achievementId);
  }

  /**
   * Get achievements by category
   */
  static getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
    return ACHIEVEMENTS.filter((a) => a.category === category);
  }

  /**
   * Get recently earned achievements for a user
   */
  static async getRecentAchievements(
    userId: string,
    limit: number = 5
  ): Promise<IUserAchievement[]> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    return UserAchievement.find({ user_id: userObjectId }).sort({ earned_at: -1 }).limit(limit);
  }

  /**
   * Get count of earned achievements
   */
  static async getEarnedCount(userId: string): Promise<number> {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    return UserAchievement.countDocuments({ user_id: userObjectId });
  }

  /**
   * Get total available achievements
   */
  static getTotalAchievements(): number {
    return ACHIEVEMENTS.length;
  }
}
