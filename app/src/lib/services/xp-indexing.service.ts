import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { UserStreak } from '@/models/UserStreak';
import { CourseEnrollment } from '@/models/CourseEnrollment';
import { UserProgress } from '@/models/UserProgress';
import { getSolanaXPService } from './solana-xp.service';
import mongoose from 'mongoose';

/**
 * XP Indexing Service
 * Handles XP aggregation, caching, and leaderboard data management
 */

export interface IndexedUserXP {
  userId: string;
  walletAddress?: string;
  username?: string;
  avatarUrl?: string;
  totalXp: number;
  onChainXp: number;
  offChainXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  challengesCompleted: number;
  lastActivityAt?: Date;
  lastSyncedAt: Date;
}

export interface LeaderboardFilters {
  timeframe?: 'all-time' | 'monthly' | 'weekly' | 'daily';
  sortBy?: 'xp' | 'streak' | 'courses' | 'challenges';
  limit?: number;
  offset?: number;
}

export interface LeaderboardResult {
  entries: Array<IndexedUserXP & { rank: number }>;
  total: number;
  timeframe: string;
  lastUpdated: Date;
}

export class XPIndexingService {
  /**
   * Index a single user's XP data
   */
  static async indexUser(userId: string): Promise<IndexedUserXP | null> {
    await connectToDatabase();

    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Get user data
      const user = await User.findById(userObjectId);
      if (!user) return null;

      // Get streak data
      const streak = await UserStreak.findOne({ user_id: userObjectId });

      // Get course completions
      const coursesCompleted = await CourseEnrollment.countDocuments({
        user_id: userObjectId,
        completed_at: { $ne: null },
      });

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

      // Get on-chain XP if wallet connected
      let onChainXp = 0;
      if (user.wallet_address) {
        try {
          const solanaService = getSolanaXPService();
          if (solanaService.isConfigured()) {
            const balance = await solanaService.getXPBalance(user.wallet_address);
            onChainXp = balance?.balance || 0;
          }
        } catch (error) {
          console.error('Error fetching on-chain XP:', error);
        }
      }

      const offChainXp = user.total_xp || 0;
      const totalXp = Math.max(offChainXp, onChainXp); // Use the higher of the two

      const indexedData: IndexedUserXP = {
        userId: userId,
        walletAddress: user.wallet_address,
        username: user.display_name || user.email?.split('@')[0],
        avatarUrl: user.avatar_url,
        totalXp,
        onChainXp,
        offChainXp,
        level: Math.floor(Math.sqrt(totalXp / 100)),
        currentStreak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
        coursesCompleted,
        lessonsCompleted,
        challengesCompleted,
        lastActivityAt: streak?.last_activity_date || undefined,
        lastSyncedAt: new Date(),
      };

      // Update user's cached XP data
      await User.findByIdAndUpdate(userObjectId, {
        total_xp: totalXp,
        current_streak: streak?.current_streak || 0,
        courses_completed: coursesCompleted,
        last_synced_at: new Date(),
      });

      return indexedData;
    } catch (error) {
      console.error('Error indexing user XP:', error);
      return null;
    }
  }

  /**
   * Index multiple users' XP data
   */
  static async indexUsers(userIds: string[]): Promise<Map<string, IndexedUserXP | null>> {
    const results = new Map<string, IndexedUserXP | null>();

    // Process in batches to avoid overwhelming the database
    const batchSize = 20;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const indexedBatch = await Promise.all(batch.map((userId) => this.indexUser(userId)));

      batch.forEach((userId, index) => {
        results.set(userId, indexedBatch[index]);
      });
    }

    return results;
  }

  /**
   * Get leaderboard data with filters
   */
  static async getLeaderboard(filters: LeaderboardFilters = {}): Promise<LeaderboardResult> {
    await connectToDatabase();

    const { timeframe = 'all-time', sortBy = 'xp', limit = 50, offset = 0 } = filters;

    // Build date filter
    let dateFilter: Date | null = null;
    const now = new Date();

    switch (timeframe) {
      case 'daily':
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        dateFilter = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    // Build sort configuration
    let sortField: Record<string, 1 | -1>;
    switch (sortBy) {
      case 'streak':
        sortField = { current_streak: -1, total_xp: -1 };
        break;
      case 'courses':
        sortField = { courses_completed: -1, total_xp: -1 };
        break;
      case 'challenges':
        sortField = { challenges_completed: -1, total_xp: -1 };
        break;
      case 'xp':
      default:
        sortField = { total_xp: -1 };
    }

    // Build pipeline
    const pipeline: mongoose.PipelineStage[] = [
      // Filter users who opted into leaderboard
      { $match: { show_on_leaderboard: { $ne: false } } },
    ];

    // Add date filter if applicable
    if (dateFilter) {
      pipeline.push({
        $match: { last_activity_at: { $gte: dateFilter } },
      });
    }

    // Lookup streak data
    pipeline.push({
      $lookup: {
        from: 'userstreaks',
        localField: '_id',
        foreignField: 'user_id',
        as: 'streak_data',
      },
    });

    pipeline.push({
      $unwind: { path: '$streak_data', preserveNullAndEmptyArrays: true },
    });

    // Add computed fields
    pipeline.push({
      $addFields: {
        current_streak: { $ifNull: ['$streak_data.current_streak', 0] },
        longest_streak: { $ifNull: ['$streak_data.longest_streak', 0] },
      },
    });

    // Sort
    pipeline.push({ $sort: sortField });

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Paginate
    pipeline.push({ $skip: offset });
    pipeline.push({ $limit: limit });

    // Project final fields
    pipeline.push({
      $project: {
        userId: '$_id',
        walletAddress: '$wallet_address',
        username: { $ifNull: ['$display_name', '$email'] },
        avatarUrl: '$avatar_url',
        totalXp: { $ifNull: ['$total_xp', 0] },
        level: {
          $floor: { $sqrt: { $divide: [{ $ifNull: ['$total_xp', 0] }, 100] } },
        },
        currentStreak: '$current_streak',
        longestStreak: '$longest_streak',
        coursesCompleted: { $ifNull: ['$courses_completed', 0] },
      },
    });

    const users = await User.aggregate(pipeline);

    // Add ranks
    const entries = users.map((user, index) => ({
      ...user,
      userId: user.userId.toString(),
      onChainXp: 0, // Would need to fetch separately for on-chain
      offChainXp: user.totalXp,
      lessonsCompleted: 0, // Could add if needed
      challengesCompleted: 0, // Could add if needed
      lastSyncedAt: new Date(),
      rank: offset + index + 1,
    }));

    return {
      entries,
      total,
      timeframe,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get user's rank in leaderboard
   */
  static async getUserRank(
    userId: string,
    sortBy: 'xp' | 'streak' | 'courses' = 'xp'
  ): Promise<number> {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return 0;

    let query: Record<string, unknown>;
    switch (sortBy) {
      case 'streak':
        const streak = await UserStreak.findOne({
          user_id: new mongoose.Types.ObjectId(userId),
        });
        const currentStreak = streak?.current_streak || 0;
        query = { current_streak: { $gt: currentStreak } };
        break;
      case 'courses':
        query = { courses_completed: { $gt: user.courses_completed || 0 } };
        break;
      case 'xp':
      default:
        query = { total_xp: { $gt: user.total_xp || 0 } };
    }

    const rank = await User.countDocuments({
      ...query,
      show_on_leaderboard: { $ne: false },
    });

    return rank + 1;
  }

  /**
   * Sync on-chain XP for all users with wallet addresses
   * This should be run periodically (e.g., every hour)
   */
  static async syncOnChainXP(): Promise<{
    synced: number;
    errors: number;
    skipped: number;
  }> {
    await connectToDatabase();

    const solanaService = getSolanaXPService();
    if (!solanaService.isConfigured()) {
      return { synced: 0, errors: 0, skipped: 0 };
    }

    // Get all users with wallet addresses
    const users = await User.find({
      wallet_address: { $exists: true, $ne: null },
    }).select('_id wallet_address total_xp');

    let synced = 0;
    let errors = 0;
    let skipped = 0;

    // Batch wallet addresses for efficient fetching
    const walletAddresses = users.map((u) => u.wallet_address).filter((a): a is string => !!a);

    const balances = await solanaService.getBatchXPBalances(walletAddresses);

    for (const user of users) {
      if (!user.wallet_address) {
        skipped++;
        continue;
      }

      try {
        const balance = balances.get(user.wallet_address);
        if (balance) {
          const newTotal = Math.max(user.total_xp || 0, balance.balance);

          if (newTotal !== user.total_xp) {
            await User.findByIdAndUpdate(user._id, {
              total_xp: newTotal,
              on_chain_xp: balance.balance,
              last_synced_at: new Date(),
            });
            synced++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error syncing XP for user ${user._id}:`, error);
        errors++;
      }
    }

    return { synced, errors, skipped };
  }

  /**
   * Get XP statistics
   */
  static async getXPStats(): Promise<{
    totalUsers: number;
    totalXP: number;
    averageXP: number;
    topLevel: number;
    usersWithOnChainXP: number;
  }> {
    await connectToDatabase();

    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalXP: { $sum: { $ifNull: ['$total_xp', 0] } },
          averageXP: { $avg: { $ifNull: ['$total_xp', 0] } },
          maxXP: { $max: { $ifNull: ['$total_xp', 0] } },
          usersWithWallet: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$wallet_address', null] }] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (!stats.length) {
      return {
        totalUsers: 0,
        totalXP: 0,
        averageXP: 0,
        topLevel: 0,
        usersWithOnChainXP: 0,
      };
    }

    const { totalUsers, totalXP, averageXP, maxXP, usersWithWallet } = stats[0];

    return {
      totalUsers,
      totalXP: Math.round(totalXP),
      averageXP: Math.round(averageXP),
      topLevel: Math.floor(Math.sqrt(maxXP / 100)),
      usersWithOnChainXP: usersWithWallet,
    };
  }
}
