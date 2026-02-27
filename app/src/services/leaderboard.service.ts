import { connectToDatabase } from '@/lib/mongodb';
import { User, UserStreak, CourseEnrollment } from '@/models';
import mongoose from 'mongoose';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username?: string;
  displayName: string;
  avatarUrl?: string;
  walletAddress?: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  coursesCompleted: number;
}

export type LeaderboardTimeframe = 'all-time' | 'monthly' | 'weekly';
export type LeaderboardSortBy = 'xp' | 'streak' | 'courses';

export class LeaderboardService {
  private static async resolveUserForLeaderboard(userIdentifier: string) {
    const query = mongoose.Types.ObjectId.isValid(userIdentifier)
      ? { $or: [{ _id: new mongoose.Types.ObjectId(userIdentifier) }, { wallet_address: userIdentifier }] }
      : { wallet_address: userIdentifier };

    return User.findOne(query).select(
      '_id show_on_leaderboard total_xp current_streak courses_completed'
    );
  }

  /**
   * Get leaderboard entries
   */
  static async getLeaderboard(
    options: {
      timeframe?: LeaderboardTimeframe;
      sortBy?: LeaderboardSortBy;
      limit?: number;
      offset?: number;
      courseId?: string;
    } = {}
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    await connectToDatabase();

    const { timeframe = 'all-time', sortBy = 'xp', limit = 50, offset = 0, courseId } = options;

    // If courseId is provided, use course-specific leaderboard
    if (courseId) {
      return this.getCourseLeaderboard(courseId, timeframe, sortBy, limit, offset);
    }

    // Base query - only show users who opted in to leaderboard
    const baseQuery = { show_on_leaderboard: true };

    // Get total count
    const total = await User.countDocuments(baseQuery);

    // Sort field based on sortBy parameter
    let sortField: Record<string, 1 | -1>;
    switch (sortBy) {
      case 'streak':
        sortField = { current_streak: -1, total_xp: -1 };
        break;
      case 'courses':
        sortField = { courses_completed: -1, total_xp: -1 };
        break;
      case 'xp':
      default:
        sortField = { total_xp: -1 };
    }

    // For timeframe filtering, we'll aggregate XP from progress
    if (timeframe !== 'all-time') {
      return this.getTimeframedLeaderboard(timeframe, sortBy, limit, offset);
    }

    // Get users with their streak data
    const users = await User.aggregate([
      { $match: baseQuery },
      {
        $lookup: {
          from: 'userstreaks',
          localField: '_id',
          foreignField: 'user_id',
          as: 'streak_data',
        },
      },
      { $unwind: { path: '$streak_data', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'courseenrollments',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$user_id', '$$userId'] }, { $ne: ['$completed_at', null] }],
                },
              },
            },
          ],
          as: 'completed_courses',
        },
      },
      {
        $addFields: {
          current_streak: { $ifNull: ['$streak_data.current_streak', 0] },
          courses_completed: { $size: '$completed_courses' },
        },
      },
      { $sort: sortField },
      { $skip: offset },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          username: 1,
          display_name: 1,
          avatar_url: 1,
          wallet_address: 1,
          total_xp: 1,
          level: 1,
          current_streak: 1,
          courses_completed: 1,
        },
      },
    ]);

    const entries: LeaderboardEntry[] = users.map((user, index) => ({
      rank: offset + index + 1,
      userId: user._id.toString(),
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      walletAddress: user.wallet_address,
      totalXp: user.total_xp,
      level: user.level,
      currentStreak: user.current_streak,
      coursesCompleted: user.courses_completed,
    }));

    return { entries, total };
  }

  /**
   * Get timeframed leaderboard (weekly/monthly)
   */
  private static async getTimeframedLeaderboard(
    timeframe: 'weekly' | 'monthly',
    sortBy: LeaderboardSortBy,
    limit: number,
    offset: number
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    const now = new Date();
    let startDate: Date;

    if (timeframe === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Aggregate XP earned in timeframe from UserProgress
    const results = await User.aggregate([
      { $match: { show_on_leaderboard: true } },
      {
        $lookup: {
          from: 'userprogress',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$user_id', '$$userId'] }, { $gte: ['$completed_at', startDate] }],
                },
              },
            },
            {
              $group: {
                _id: null,
                timeframe_xp: { $sum: '$xp_earned' },
              },
            },
          ],
          as: 'timeframe_progress',
        },
      },
      { $unwind: { path: '$timeframe_progress', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'userstreaks',
          localField: '_id',
          foreignField: 'user_id',
          as: 'streak_data',
        },
      },
      { $unwind: { path: '$streak_data', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'courseenrollments',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$user_id', '$$userId'] }, { $gte: ['$completed_at', startDate] }],
                },
              },
            },
          ],
          as: 'timeframe_courses',
        },
      },
      {
        $addFields: {
          timeframe_xp: { $ifNull: ['$timeframe_progress.timeframe_xp', 0] },
          current_streak: { $ifNull: ['$streak_data.current_streak', 0] },
          courses_completed: { $size: '$timeframe_courses' },
        },
      },
      { $match: { timeframe_xp: { $gt: 0 } } },
      {
        $sort:
          sortBy === 'xp'
            ? { timeframe_xp: -1 }
            : sortBy === 'streak'
              ? { current_streak: -1, timeframe_xp: -1 }
              : { courses_completed: -1, timeframe_xp: -1 },
      },
      {
        $facet: {
          entries: [{ $skip: offset }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const entries: LeaderboardEntry[] = results[0].entries.map(
      (user: Record<string, unknown>, index: number) => ({
        rank: offset + index + 1,
        userId: (user._id as mongoose.Types.ObjectId).toString(),
        username: user.username as string | undefined,
        displayName: user.display_name as string,
        avatarUrl: user.avatar_url as string | undefined,
        walletAddress: user.wallet_address as string | undefined,
        totalXp: user.timeframe_xp as number,
        level: user.level as number,
        currentStreak: user.current_streak as number,
        coursesCompleted: user.courses_completed as number,
      })
    );

    const total = results[0].total[0]?.count || 0;

    return { entries, total };
  }

  /**
   * Get user rank
   */
  static async getUserRank(
    userId: string,
    timeframe: LeaderboardTimeframe = 'all-time'
  ): Promise<{ rank: number; totalParticipants: number } | null> {
    await connectToDatabase();

    const user = await this.resolveUserForLeaderboard(userId);
    if (!user || !user.show_on_leaderboard) return null;

    const resolvedUserId = user._id.toString();

    if (timeframe === 'all-time') {
      const rank = await User.countDocuments({
        show_on_leaderboard: true,
        total_xp: { $gt: user.total_xp },
      });

      const totalParticipants = await User.countDocuments({ show_on_leaderboard: true });

      return { rank: rank + 1, totalParticipants };
    }

    // For timeframed ranks, we need to calculate XP in that period
    const { entries, total } = await this.getTimeframedLeaderboard(
      timeframe as 'weekly' | 'monthly',
      'xp',
      1000, // Get enough entries to find the user
      0
    );

    const userEntry = entries.find((e) => e.userId === resolvedUserId);
    if (!userEntry) return { rank: 0, totalParticipants: total };

    return { rank: userEntry.rank, totalParticipants: total };
  }

  /**
   * Get users near a specific rank
   */
  static async getUsersNearRank(userId: string, range: number = 2): Promise<LeaderboardEntry[]> {
    await connectToDatabase();

    const rankData = await this.getUserRank(userId);
    if (!rankData) return [];

    const { rank } = rankData;
    const startRank = Math.max(1, rank - range);
    const limit = range * 2 + 1;
    const offset = startRank - 1;

    const { entries } = await this.getLeaderboard({ limit, offset });
    return entries;
  }

  /**
   * Get leaderboard filtered by course - shows users enrolled in a specific course ranked by XP earned in that course
   */
  private static async getCourseLeaderboard(
    courseId: string,
    timeframe: LeaderboardTimeframe,
    sortBy: LeaderboardSortBy,
    limit: number,
    offset: number
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    await connectToDatabase();

    let startDate: Date | null = null;
    if (timeframe === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'monthly') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Build the enrollment match condition
    const enrollmentMatch: Record<string, unknown> = {
      course_id: new mongoose.Types.ObjectId(courseId),
    };

    // Aggregate from CourseEnrollments for the specific course
    const pipeline: mongoose.PipelineStage[] = [
      { $match: enrollmentMatch },
      // Join with users
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      // Filter to only users who opted in to leaderboard
      { $match: { 'user.show_on_leaderboard': true } },
      // Join with user streaks
      {
        $lookup: {
          from: 'userstreaks',
          localField: 'user_id',
          foreignField: 'user_id',
          as: 'streak_data',
        },
      },
      { $unwind: { path: '$streak_data', preserveNullAndEmptyArrays: true } },
    ];

    // If timeframe specified, filter progress by date and calculate XP in timeframe
    if (startDate) {
      pipeline.push(
        {
          $lookup: {
            from: 'userprogress',
            let: { enrollmentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$enrollment_id', '$$enrollmentId'] },
                      { $gte: ['$completed_at', startDate] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  timeframe_xp: { $sum: '$xp_earned' },
                },
              },
            ],
            as: 'timeframe_progress',
          },
        },
        { $unwind: { path: '$timeframe_progress', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            course_xp: { $ifNull: ['$timeframe_progress.timeframe_xp', 0] },
          },
        }
      );
    } else {
      // Use the XP from the enrollment
      pipeline.push({
        $addFields: {
          course_xp: { $ifNull: ['$xp_earned', 0] },
        },
      });
    }

    // Add computed fields
    pipeline.push({
      $addFields: {
        current_streak: { $ifNull: ['$streak_data.current_streak', 0] },
        is_completed: { $cond: [{ $ne: ['$completed_at', null] }, 1, 0] },
      },
    });

    // Sort based on sortBy
    const sortStage: Record<string, 1 | -1> =
      sortBy === 'streak'
        ? { current_streak: -1, course_xp: -1 }
        : sortBy === 'courses'
          ? { is_completed: -1, course_xp: -1 }
          : { course_xp: -1 };

    pipeline.push(
      { $sort: sortStage },
      {
        $facet: {
          entries: [{ $skip: offset }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      }
    );

    const results = await CourseEnrollment.aggregate(pipeline);

    const entries: LeaderboardEntry[] = (results[0]?.entries || []).map(
      (item: Record<string, unknown>, index: number) => {
        const user = item.user as Record<string, unknown>;
        return {
          rank: offset + index + 1,
          userId: (item.user_id as mongoose.Types.ObjectId).toString(),
          username: user.username as string | undefined,
          displayName: (user.display_name as string) || 'Anonymous',
          avatarUrl: user.avatar_url as string | undefined,
          walletAddress: user.wallet_address as string | undefined,
          totalXp: item.course_xp as number,
          level: user.level as number,
          currentStreak: item.current_streak as number,
          coursesCompleted: item.is_completed as number,
        };
      }
    );

    const total = results[0]?.total[0]?.count || 0;

    return { entries, total };
  }
}
