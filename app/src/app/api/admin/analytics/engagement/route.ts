import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { User } from '@/models/User';
import { CommunityPost } from '@/models/CommunityPost';
import { CommunityComment } from '@/models/CommunityComment';
import { CommunityLike } from '@/models/CommunityLike';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { hasAdminAllowlist, isAllowlistedAdmin } from '@/lib/admin-access';

/**
 * GET /api/admin/analytics/engagement
 * Returns community and engagement metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowlistEnabled = hasAdminAllowlist();
    if (
      allowlistEnabled &&
      !isAllowlistedAdmin({ id: session.user.id, email: session.user.email })
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    if (!allowlistEnabled) {
      const adminLookupFilters: Record<string, unknown>[] = [];

      if (session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)) {
        adminLookupFilters.push({ _id: new mongoose.Types.ObjectId(session.user.id) });
      }

      if (session.user.email) {
        adminLookupFilters.push({ email: session.user.email });
      }

      if (session.user.walletAddress) {
        adminLookupFilters.push({ wallet_address: session.user.walletAddress });
      }

      if (adminLookupFilters.length === 0) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const adminUser = await User.findOne({ $or: adminLookupFilters });
      if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get community posts metrics
    const totalPosts = await CommunityPost.countDocuments();
    const pinnedPosts = await CommunityPost.countDocuments({ is_pinned: true });
    const announcementPosts = await CommunityPost.countDocuments({
      is_announcement: true,
    });
    const discussionPosts = await CommunityPost.countDocuments({ category: 'Discussion' });

    // Get posts by category
    const postsByCategory = await CommunityPost.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgReplies: { $avg: '$replies_count' },
          avgLikes: { $avg: '$likes_count' },
          avgViews: { $avg: '$views_count' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get total comments
    const totalComments = await CommunityComment.countDocuments();

    // Get comments per post
    const commentsStats = {
      avgCommentsPerPost: totalPosts > 0 ? Number((totalComments / totalPosts).toFixed(2)) : 0,
    };

    // Get total likes
    const totalLikes = await CommunityLike.countDocuments();

    // Get likes distribution
    const likesDistribution = await CommunityLike.aggregate([
      {
        $project: {
          likeType: {
            $cond: [{ $ifNull: ['$comment_id', false] }, 'comment', 'post'],
          },
        },
      },
      {
        $group: {
          _id: '$likeType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get engagement by user (top engaged users)
    const topEngagedUsers = await User.aggregate([
      {
        $addFields: {
          engagement: {
            $add: [
              { $multiply: ['$courses_completed', 10] },
              { $multiply: ['$total_xp', 0.5] },
              { $multiply: ['$current_streak', 5] },
            ],
          },
        },
      },
      {
        $sort: { engagement: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          display_name: 1,
          total_xp: 1,
          level: 1,
          courses_completed: 1,
          current_streak: 1,
          engagement: 1,
        },
      },
    ]);

    // Get 7-day engagement stats
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const last7DaysPosts = await CommunityPost.countDocuments({
      created_at: { $gte: sevenDaysAgo },
    });

    const last7DaysComments = await CommunityComment.countDocuments({
      created_at: { $gte: sevenDaysAgo },
    });

    const last7DaysLikes = await CommunityLike.countDocuments({
      created_at: { $gte: sevenDaysAgo },
    });

    // Get total engagement (posts + comments + likes)
    const totalEngagementItems = totalPosts + totalComments + totalLikes;

    // Get total users first
    const totalUsers = await User.countDocuments();

    // Get engagement rate (users who participated)
    const usersWhoPosted = await CommunityPost.distinct('author');
    const usersWhoCommented = await CommunityComment.distinct('author_id');
    const usersWhoLiked = await CommunityLike.distinct('user_id');

    const uniqueEngagedUsers = new Set([...usersWhoPosted, ...usersWhoCommented, ...usersWhoLiked])
      .size;

    const engagementRate =
      totalUsers > 0 ? ((uniqueEngagedUsers / totalUsers) * 100).toFixed(2) : 0;

    return NextResponse.json(
      {
        posts: {
          total: totalPosts,
          pinned: pinnedPosts,
          announcements: announcementPosts,
          discussions: discussionPosts,
          byCategory: postsByCategory,
        },
        comments: {
          total: totalComments,
          stats: commentsStats,
        },
        likes: {
          total: totalLikes,
          distribution: likesDistribution,
        },
        engagement: {
          total: totalEngagementItems,
          last7Days: {
            posts: last7DaysPosts,
            comments: last7DaysComments,
            likes: last7DaysLikes,
          },
          topEngagedUsers,
        },
        engagementMetrics: {
          totalEngagedUsers: uniqueEngagedUsers,
          engagementRate: parseFloat(engagementRate as any),
          totalUsers,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching engagement analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch engagement analytics' }, { status: 500 });
  }
}
