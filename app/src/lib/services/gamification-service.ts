import { connectToDatabase } from '@/lib/mongodb';
import {
  UserGamification,
  XPTransaction,
  IUserGamification,
  IXPTransaction,
} from '@/lib/db/models/gamification';
import { CommunityPost, CommunityComment, CommunityLike, CourseEnrollment } from '@/models';
import mongoose from 'mongoose';
import {
  XPBalance,
  XPTransactionType,
  StreakData,
  StreakDay,
  StreakMilestone,
  UserAchievement,
  Achievement,
  ACHIEVEMENTS,
  STREAK_MILESTONES,
  XP_REWARDS,
  getXPBalance,
  getTodayDate,
  isStreakActive,
  LeaderboardEntry,
  LeaderboardTimeframe,
  LeaderboardData,
} from '@/types/gamification';

/**
 * Gamification Service
 * Handles XP, streaks, achievements, and leaderboard functionality
 */
export class GamificationService {
  // ==================== XP Operations ====================

  /**
   * Get user's XP balance and level info
   */
  static async getXPBalance(userId: string): Promise<XPBalance> {
    await connectToDatabase();

    const user = await UserGamification.findOne({ userId });
    if (!user) {
      return getXPBalance(0);
    }

    return getXPBalance(user.totalXP);
  }

  /**
   * Award XP to a user
   */
  static async awardXP(
    userId: string,
    amount: number,
    type: XPTransactionType,
    source: string,
    description: string
  ): Promise<{ newTotal: number; newLevel: number; leveledUp: boolean }> {
    await connectToDatabase();

    // Get current user data or create new
    let user = await UserGamification.findOne({ userId });
    const previousLevel = user ? Math.floor(Math.sqrt(user.totalXP / 100)) : 0;

    if (!user) {
      user = await UserGamification.create({
        userId,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakFreezes: 0,
        lessonsCompleted: 0,
        coursesCompleted: 0,
        challengesCompleted: 0,
        totalTimeSpent: 0,
        achievements: [],
        dailyActivity: new Map(),
      });
    }

    // Update total XP
    user.totalXP += amount;
    await user.save();

    // Record transaction
    await XPTransaction.create({
      userId,
      amount,
      type,
      source,
      description,
    });

    const newLevel = Math.floor(Math.sqrt(user.totalXP / 100));
    const leveledUp = newLevel > previousLevel;

    return {
      newTotal: user.totalXP,
      newLevel,
      leveledUp,
    };
  }

  /**
   * Get XP transaction history for a user
   */
  static async getXPHistory(userId: string, limit: number = 50): Promise<IXPTransaction[]> {
    await connectToDatabase();

    const transactions = await XPTransaction.find({ userId }).sort({ createdAt: -1 }).limit(limit);

    return transactions;
  }

  // ==================== Streak Operations ====================

  /**
   * Get user's streak data
   */
  static async getStreakData(userId: string): Promise<StreakData> {
    await connectToDatabase();

    const user = await UserGamification.findOne({ userId });

    if (!user) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakHistory: [],
        streakFreezes: 0,
        milestones: STREAK_MILESTONES.map((m) => ({
          days: m.days,
          name: m.name,
          achieved: false,
          xpReward: m.xpReward,
        })),
      };
    }

    // Build streak history from daily activity
    const streakHistory: StreakDay[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayActivity = user.dailyActivity?.get(dateStr);

      streakHistory.push({
        date: dateStr,
        hasActivity: !!dayActivity && dayActivity.lessonsCompleted > 0,
        xpEarned: dayActivity?.xpEarned || 0,
        lessonsCompleted: dayActivity?.lessonsCompleted || 0,
      });
    }

    // Build milestones
    const milestones: StreakMilestone[] = STREAK_MILESTONES.map((m) => ({
      days: m.days,
      name: m.name,
      achieved: user.longestStreak >= m.days,
      xpReward: m.xpReward,
    }));

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
      streakHistory,
      streakFreezes: user.streakFreezes,
      milestones,
    };
  }

  /**
   * Record activity and update streak
   */
  static async recordActivity(
    userId: string
  ): Promise<{ streak: number; xpBonuses: Array<{ type: string; amount: number }> }> {
    await connectToDatabase();

    const today = getTodayDate();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let user = await UserGamification.findOne({ userId });
    const xpBonuses: Array<{ type: string; amount: number }> = [];

    if (!user) {
      user = await UserGamification.create({
        userId,
        totalXP: 0,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        streakFreezes: 0,
        lessonsCompleted: 0,
        coursesCompleted: 0,
        challengesCompleted: 0,
        totalTimeSpent: 0,
        achievements: [],
        dailyActivity: new Map(),
      });

      // First completion of the day bonus
      xpBonuses.push({ type: 'daily_first', amount: XP_REWARDS.FIRST_COMPLETION_OF_DAY });

      return { streak: 1, xpBonuses };
    }

    const lastActivity = user.lastActivityDate;

    // Already recorded activity today
    if (lastActivity === today) {
      return { streak: user.currentStreak, xpBonuses };
    }

    // Update streak
    if (lastActivity === yesterday) {
      // Continuing streak
      user.currentStreak += 1;
      user.longestStreak = Math.max(user.longestStreak, user.currentStreak);

      // Streak bonus
      xpBonuses.push({ type: 'streak_bonus', amount: XP_REWARDS.DAILY_STREAK_BONUS });

      // Check for milestone rewards
      const newMilestone = STREAK_MILESTONES.find((m) => user.currentStreak === m.days);
      if (newMilestone) {
        xpBonuses.push({ type: `milestone_${newMilestone.days}`, amount: newMilestone.xpReward });
      }
    } else if (lastActivity && lastActivity !== yesterday) {
      // Streak broken - check for freeze
      if (user.streakFreezes > 0) {
        user.streakFreezes -= 1;
        user.currentStreak += 1;
        user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
        xpBonuses.push({ type: 'streak_bonus', amount: XP_REWARDS.DAILY_STREAK_BONUS });
      } else {
        // Reset streak
        user.currentStreak = 1;
      }
    } else {
      // First activity ever or no previous activity
      user.currentStreak = 1;
      user.longestStreak = Math.max(user.longestStreak, 1);
    }

    // First completion of the day
    const todayActivity = user.dailyActivity?.get(today);
    if (!todayActivity?.firstCompletionClaimed) {
      xpBonuses.push({ type: 'daily_first', amount: XP_REWARDS.FIRST_COMPLETION_OF_DAY });

      // Mark as claimed
      user.dailyActivity = user.dailyActivity || new Map();
      const existing = user.dailyActivity.get(today) || {
        xpEarned: 0,
        lessonsCompleted: 0,
        firstCompletionClaimed: false,
      };
      existing.firstCompletionClaimed = true;
      user.dailyActivity.set(today, existing);
    }

    user.lastActivityDate = today;
    await user.save();

    // Award XP bonuses
    for (const bonus of xpBonuses) {
      await this.awardXP(
        userId,
        bonus.amount,
        bonus.type.startsWith('milestone') ? 'streak_bonus' : (bonus.type as XPTransactionType),
        `streak:${bonus.type}`,
        `${bonus.type === 'daily_first' ? 'First completion of the day' : `Streak bonus: ${bonus.type}`}`
      );
    }

    return { streak: user.currentStreak, xpBonuses };
  }

  // ==================== Achievement Operations ====================

  /**
   * Get user's achievements
   */
  static async getAchievements(userId: string): Promise<{
    unlocked: UserAchievement[];
    available: Achievement[];
    progress: Map<string, number>;
  }> {
    await connectToDatabase();

    const user = await UserGamification.findOne({ userId });

    if (!user) {
      return {
        unlocked: [],
        available: ACHIEVEMENTS,
        progress: new Map(),
      };
    }

    const unlockedIds = new Set(user.achievements.map((a) => a.achievementId));
    const unlocked: UserAchievement[] = user.achievements.map((a) => ({
      achievementId: a.achievementId,
      unlockedAt: a.unlockedAt,
      nftMintAddress: a.nftMintAddress,
    }));

    const available = ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id));

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const [communityPosts, communityComments, communityLikes] = userObjectId
      ? await Promise.all([
          CommunityPost.countDocuments({ author: userObjectId }),
          CommunityComment.countDocuments({ author_id: userObjectId }),
          CommunityLike.countDocuments({ user_id: userObjectId }),
        ])
      : [0, 0, 0];

    // Calculate progress for each achievement
    const progress = new Map<string, number>();
    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) {
        progress.set(achievement.id, 100);
        continue;
      }

      let currentValue = 0;
      switch (achievement.criteria.type) {
        case 'lessons_completed':
          currentValue = user.lessonsCompleted;
          break;
        case 'courses_completed':
          currentValue = user.coursesCompleted;
          break;
        case 'challenges_completed':
          currentValue = user.challengesCompleted;
          break;
        case 'community_posts':
          currentValue = communityPosts;
          break;
        case 'community_comments':
          currentValue = communityComments;
          break;
        case 'community_likes':
          currentValue = communityLikes;
          break;
        case 'xp_earned':
          currentValue = user.totalXP;
          break;
        case 'level_reached':
          currentValue = Math.floor(Math.sqrt(user.totalXP / 100));
          break;
        case 'streak_days':
          currentValue = user.longestStreak;
          break;
        case 'first_lesson':
        case 'first_course':
          currentValue =
            achievement.criteria.type === 'first_lesson'
              ? Math.min(user.lessonsCompleted, 1)
              : Math.min(user.coursesCompleted, 1);
          break;
        default:
          currentValue = 0;
      }

      const progressPercent = Math.min(
        Math.round((currentValue / achievement.criteria.value) * 100),
        100
      );
      progress.set(achievement.id, progressPercent);
    }

    return { unlocked, available, progress };
  }

  /**
   * Check and unlock achievements for a user
   */
  static async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    await connectToDatabase();

    const user = await UserGamification.findOne({ userId });
    if (!user) return [];

    const unlockedIds = new Set(user.achievements.map((a) => a.achievementId));
    const newlyUnlocked: Achievement[] = [];

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const [communityPosts, communityComments, communityLikes] = userObjectId
      ? await Promise.all([
          CommunityPost.countDocuments({ author: userObjectId }),
          CommunityComment.countDocuments({ author_id: userObjectId }),
          CommunityLike.countDocuments({ user_id: userObjectId }),
        ])
      : [0, 0, 0];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue;

      // Check supply cap if defined
      if (achievement.maxSupply) {
        const awardsCount = await UserGamification.countDocuments({
          'achievements.achievementId': achievement.id,
        });

        if (awardsCount >= achievement.maxSupply) {
          continue; // Skip - supply exhausted
        }
      }

      let criteriaMatched = false;
      const metadata = achievement.criteria.metadata;

      switch (achievement.criteria.type) {
        case 'lessons_completed':
          criteriaMatched = user.lessonsCompleted >= achievement.criteria.value;
          break;

        case 'courses_completed':
          if (metadata?.track && userObjectId) {
            // Check specific track completion
            const trackCourses = await CourseEnrollment.countDocuments({
              user_id: userObjectId,
              completed: true,
              'course.track': metadata.track,
            });
            criteriaMatched = trackCourses >= achievement.criteria.value;
          } else if (metadata?.allTracks && userObjectId) {
            // Check completion across all tracks (need distinct tracks)
            const completedCourses = await CourseEnrollment.find({
              user_id: userObjectId,
              completed: true,
            }).distinct('course.track');
            criteriaMatched = completedCourses.length >= achievement.criteria.value;
          } else {
            criteriaMatched = user.coursesCompleted >= achievement.criteria.value;
          }
          break;

        case 'challenges_completed':
          if (metadata?.language && userObjectId) {
            // Check challenge language matches
            const ChallengeProgress = mongoose.model('ChallengeProgress');
            const matchingChallenges = await ChallengeProgress.countDocuments({
              user_id: userObjectId,
              completed: true,
              'challenge.language': metadata.language,
            });
            criteriaMatched = matchingChallenges >= achievement.criteria.value;
          } else {
            criteriaMatched = user.challengesCompleted >= achievement.criteria.value;
          }
          break;

        case 'community_posts':
          criteriaMatched = communityPosts >= achievement.criteria.value;
          break;

        case 'community_comments':
          criteriaMatched = communityComments >= achievement.criteria.value;
          break;

        case 'community_likes':
          criteriaMatched = communityLikes >= achievement.criteria.value;
          break;

        case 'xp_earned':
          criteriaMatched = user.totalXP >= achievement.criteria.value;
          break;

        case 'level_reached':
          criteriaMatched = Math.floor(Math.sqrt(user.totalXP / 100)) >= achievement.criteria.value;
          break;

        case 'streak_days':
          criteriaMatched = user.longestStreak >= achievement.criteria.value;
          break;

        case 'first_lesson':
          criteriaMatched = user.lessonsCompleted >= 1;
          break;

        case 'first_course':
          criteriaMatched = user.coursesCompleted >= 1;
          break;

        case 'perfect_score':
          // Check if user has perfect score on any challenge
          if (userObjectId) {
            const ChallengeProgress = mongoose.model('ChallengeProgress');
            const perfectScores = await ChallengeProgress.countDocuments({
              user_id: userObjectId,
              completed: true,
              score: 100,
              attempts: 1,
            });
            criteriaMatched = perfectScores >= achievement.criteria.value;
          } else {
            criteriaMatched = false;
          }
          break;

        case 'speed_run':
          // Check if user completed a course within time limit (hours)
          if (userObjectId) {
            const timeLimit = achievement.criteria.value * 60 * 60 * 1000; // Convert hours to ms
            const speedRuns = await CourseEnrollment.countDocuments({
              user_id: userObjectId,
              completed: true,
              $expr: {
                $lte: [{ $subtract: ['$completed_at', '$enrolled_at'] }, timeLimit],
              },
            });
            criteriaMatched = speedRuns >= 1;
          } else {
            criteriaMatched = false;
          }
          break;

        case 'early_adopter':
          // Check user registration order
          if (userObjectId) {
            const UserModel = mongoose.model('User');
            const userDoc = await UserModel.findById(userObjectId);
            if (userDoc?.createdAt) {
              const earlierUsers = await UserModel.countDocuments({
                createdAt: { $lt: userDoc.createdAt },
              });
              criteriaMatched = earlierUsers < achievement.criteria.value;
            } else {
              criteriaMatched = false;
            }
          } else {
            criteriaMatched = false;
          }
          break;

        case 'bug_hunter':
          // Check if user has submitted valid bug reports
          // Note: Requires bug report tracking system to be implemented
          // For now, this can be manually awarded by admin
          criteriaMatched = false; // TODO: Implement bug tracking system
          break;

        default:
          criteriaMatched = false;
      }

      if (criteriaMatched) {
        // Unlock achievement
        user.achievements.push({
          achievementId: achievement.id,
          unlockedAt: new Date(),
        });
        newlyUnlocked.push(achievement);

        // Award XP for achievement
        await this.awardXP(
          userId,
          achievement.xpReward,
          'achievement',
          `achievement:${achievement.id}`,
          `Achievement unlocked: ${achievement.name}`
        );
      }
    }

    if (newlyUnlocked.length > 0) {
      await user.save();
    }

    return newlyUnlocked;
  }

  // ==================== Stats Operations ====================

  /**
   * Increment lesson completion count
   */
  static async incrementLessonsCompleted(userId: string): Promise<void> {
    await connectToDatabase();

    const today = getTodayDate();

    await UserGamification.findOneAndUpdate(
      { userId },
      {
        $inc: { lessonsCompleted: 1 },
        $set: {
          [`dailyActivity.${today}.lessonsCompleted`]: {
            $add: ['$dailyActivity.' + today + '.lessonsCompleted', 1],
          },
        },
      },
      { upsert: true }
    );
  }

  /**
   * Increment course completion count
   */
  static async incrementCoursesCompleted(userId: string): Promise<void> {
    await connectToDatabase();

    await UserGamification.findOneAndUpdate(
      { userId },
      { $inc: { coursesCompleted: 1 } },
      { upsert: true }
    );
  }

  /**
   * Increment challenge completion count
   */
  static async incrementChallengesCompleted(userId: string): Promise<void> {
    await connectToDatabase();

    await UserGamification.findOneAndUpdate(
      { userId },
      { $inc: { challengesCompleted: 1 } },
      { upsert: true }
    );
  }

  // ==================== Leaderboard Operations ====================

  /**
   * Get leaderboard data
   */
  static async getLeaderboard(
    timeframe: LeaderboardTimeframe = 'all-time',
    limit: number = 100
  ): Promise<LeaderboardData> {
    await connectToDatabase();

    let query = {};
    let dateFilter: Date | null = null;

    if (timeframe === 'weekly') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeframe === 'monthly') {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    // For time-filtered leaderboards, aggregate XP from transactions
    interface UserLeaderboardData {
      userId: string;
      totalXP: number;
      currentStreak: number;
      coursesCompleted: number;
      rank: number;
    }

    let users: UserLeaderboardData[];
    if (dateFilter) {
      const aggregation = await XPTransaction.aggregate([
        { $match: { createdAt: { $gte: dateFilter } } },
        { $group: { _id: '$userId', xp: { $sum: '$amount' } } },
        { $sort: { xp: -1 } },
        { $limit: limit },
      ]);

      users = aggregation.map((u, index) => ({
        userId: u._id as string,
        totalXP: u.xp as number,
        currentStreak: 0,
        coursesCompleted: 0,
        rank: index + 1,
      }));
    } else {
      // All-time leaderboard
      const gamificationData = await UserGamification.find().sort({ totalXP: -1 }).limit(limit);

      users = gamificationData.map((u, index) => ({
        userId: u.userId,
        totalXP: u.totalXP,
        currentStreak: u.currentStreak,
        coursesCompleted: u.coursesCompleted,
        rank: index + 1,
      }));
    }

    const entries: LeaderboardEntry[] = users.map((u) => ({
      rank: u.rank,
      userId: u.userId,
      username: `User ${u.userId.slice(-6)}`, // In production, fetch from User model
      xp: u.totalXP,
      level: Math.floor(Math.sqrt(u.totalXP / 100)),
      streak: u.currentStreak,
      coursesCompleted: u.coursesCompleted,
    }));

    const totalUsers = await UserGamification.countDocuments();

    return {
      timeframe,
      entries,
      totalUsers,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get user's rank in leaderboard
   */
  static async getUserRank(userId: string): Promise<number> {
    await connectToDatabase();

    const user = await UserGamification.findOne({ userId });
    if (!user) return 0;

    const rank = await UserGamification.countDocuments({
      totalXP: { $gt: user.totalXP },
    });

    return rank + 1;
  }

  // ==================== Full Profile ====================

  /**
   * Get complete gamification profile for a user
   */
  static async getProfile(userId: string): Promise<{
    xp: XPBalance;
    streak: StreakData;
    achievements: {
      unlocked: UserAchievement[];
      available: Achievement[];
      progress: Map<string, number>;
    };
    rank: number;
    stats: {
      lessonsCompleted: number;
      coursesCompleted: number;
      challengesCompleted: number;
      totalTimeSpent: number;
    };
  }> {
    const [xp, streak, achievements, rank] = await Promise.all([
      this.getXPBalance(userId),
      this.getStreakData(userId),
      this.getAchievements(userId),
      this.getUserRank(userId),
    ]);

    await connectToDatabase();
    const user = await UserGamification.findOne({ userId });

    return {
      xp,
      streak,
      achievements,
      rank,
      stats: {
        lessonsCompleted: user?.lessonsCompleted || 0,
        coursesCompleted: user?.coursesCompleted || 0,
        challengesCompleted: user?.challengesCompleted || 0,
        totalTimeSpent: user?.totalTimeSpent || 0,
      },
    };
  }
}
