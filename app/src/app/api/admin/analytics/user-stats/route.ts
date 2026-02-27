import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { User } from '@/models/User';
import { Course } from '@/models/Course';
import { CourseEnrollment } from '@/models/CourseEnrollment';
import { CommunityPost } from '@/models/CommunityPost';
import { CommunityComment } from '@/models/CommunityComment';
import { UserAchievement } from '@/models/UserAchievement';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { hasAdminAllowlist, isAllowlistedAdmin } from '@/lib/admin-access';

/**
 * GET /api/admin/analytics/user-stats
 * Returns overall user statistics
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

    // Get total users
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();

    // Get users by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const superAdminCount = await User.countDocuments({ role: 'super_admin' });
    const regularUsers = totalUsers - adminCount - superAdminCount;

    // Get active users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsersLast7Days = await User.countDocuments({
      last_activity_at: { $gte: sevenDaysAgo },
    });

    // Get active users (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsersLast30Days = await User.countDocuments({
      last_activity_at: { $gte: thirtyDaysAgo },
    });

    // Get users by language
    const usersByLanguage = await User.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get average XP
    const xpStats = await User.aggregate([
      {
        $group: {
          _id: null,
          avgXp: { $avg: '$total_xp' },
          maxXp: { $max: '$total_xp' },
          minXp: { $min: '$total_xp' },
          totalXp: { $sum: '$total_xp' },
        },
      },
    ]);

    // Get users with email notifications enabled
    const emailNotificationsEnabled = await User.countDocuments({
      email_notifications: true,
    });

    // Get users with push notifications enabled
    const pushNotificationsEnabled = await User.countDocuments({
      push_notifications: true,
    });

    // Get average courses completed
    const courseStats = await User.aggregate([
      {
        $group: {
          _id: null,
          avgCoursesCompleted: { $avg: '$courses_completed' },
          maxCoursesCompleted: { $max: '$courses_completed' },
          totalCoursesCompleted: { $sum: '$courses_completed' },
        },
      },
    ]);

    // Get average streak
    const streakStats = await User.aggregate([
      {
        $group: {
          _id: null,
          avgStreak: { $avg: '$current_streak' },
          maxStreak: { $max: '$current_streak' },
          totalStreakDays: { $sum: '$current_streak' },
        },
      },
    ]);

    return NextResponse.json(
      {
        totalUsers,
        usersByRole: {
          admin: adminCount,
          super_admin: superAdminCount,
          user: regularUsers,
        },
        activeUsers: {
          last7Days: activeUsersLast7Days,
          last30Days: activeUsersLast30Days,
          sevenDays: activeUsersLast7Days,
          thirtyDays: activeUsersLast30Days,
        },
        usersByLanguage,
        xpStats: xpStats[0] || {},
        courseStats: {
          ...(courseStats[0] || {}),
          totalCompleted: courseStats[0]?.totalCoursesCompleted || 0,
        },
        streakStats: streakStats[0] || {},
        totalCourses,
        notifications: {
          emailEnabled: emailNotificationsEnabled,
          pushEnabled: pushNotificationsEnabled,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch user statistics' }, { status: 500 });
  }
}
