import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { hasAdminAllowlist, isAllowlistedAdmin } from '@/lib/admin-access';

/**
 * GET /api/admin/analytics/demographics
 * Returns user demographics and platform preferences
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

    // Get users by language
    const usersByLanguage = await User.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          percentage: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Convert to percentages
    const totalUsers = await User.countDocuments();
    usersByLanguage.forEach((item: any) => {
      item.percentage = ((item.count / totalUsers) * 100).toFixed(2);
    });

    // Get users by theme preference
    const usersByTheme = await User.aggregate([
      {
        $group: {
          _id: '$theme',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get users with location data
    const usersWithLocation = await User.countDocuments({
      location: { $exists: true, $ne: null },
    });

    // Get top locations (if provided by users)
    const topLocations = await User.aggregate([
      {
        $match: {
          location: { $not: { $in: [null, ''] } },
        },
      },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get users with social media links (auth method analysis)
    const authMethods = await User.aggregate([
      {
        $facet: {
          walletAuth: [
            {
              $match: { wallet_address: { $exists: true, $ne: null } },
            },
            { $count: 'count' },
          ],
          emailAuth: [
            {
              $match: { email: { $exists: true, $ne: null } },
            },
            { $count: 'count' },
          ],
          googleAuth: [
            {
              $match: { google_id: { $exists: true, $ne: null } },
            },
            { $count: 'count' },
          ],
          githubAuth: [
            {
              $match: { github_id: { $exists: true, $ne: null } },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    // Get account completion status
    const accountCompletion = await User.aggregate([
      {
        $facet: {
          profilePictureSet: [
            {
              $match: { avatar_url: { $exists: true, $ne: null } },
            },
            { $count: 'count' },
          ],
          bioSet: [
            {
              $match: { bio: { $exists: true, $ne: null } },
            },
            { $count: 'count' },
          ],
          websiteSet: [
            {
              $match: { website: { $exists: true, $ne: null } },
            },
            { $count: 'count' },
          ],
          socialMediaLinked: [
            {
              $match: {
                $or: [
                  { twitter: { $exists: true, $ne: null } },
                  { github: { $exists: true, $ne: null } },
                  { linkedin: { $exists: true, $ne: null } },
                  { discord: { $exists: true, $ne: null } },
                ],
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    // Get preference distributions
    const preferences = {
      profilePublic: await User.countDocuments({ profile_public: true }),
      showOnLeaderboard: await User.countDocuments({
        show_on_leaderboard: true,
      }),
      showActivity: await User.countDocuments({ show_activity: true }),
      emailNotificationsEnabled: await User.countDocuments({
        email_notifications: true,
      }),
      pushNotificationsEnabled: await User.countDocuments({
        push_notifications: true,
      }),
    };

    // Get user level distribution
    const levelDistribution = await User.aggregate([
      {
        $bucket: {
          groupBy: '$level',
          boundaries: [1, 10, 20, 30, 50, 100],
          default: '100+',
          output: {
            count: { $sum: 1 },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get XP distribution (quartiles)
    const xpDistribution = await User.aggregate([
      {
        $match: { total_xp: { $gt: 0 } },
      },
      {
        $bucket: {
          groupBy: '$total_xp',
          boundaries: [0, 1000, 5000, 10000, 50000],
          default: '50000+',
          output: {
            count: { $sum: 1 },
            avgLevel: { $avg: '$level' },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get retention cohort basic (users created vs active now)
    const total = totalUsers;
    const lastActivityThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const active30Days = await User.countDocuments({
      last_activity_at: { $gte: lastActivityThreshold },
    });
    const retention30DayRate = ((active30Days / total) * 100).toFixed(2);

    return NextResponse.json(
      {
        totalUsers,
        language: {
          distribution: usersByLanguage,
        },
        theme: {
          distribution: usersByTheme,
        },
        location: {
          withLocation: usersWithLocation,
          topLocations,
        },
        authMethods: authMethods[0] || {},
        accountCompletion: accountCompletion[0] || {},
        preferences,
        levels: levelDistribution,
        xp: xpDistribution,
        retention: {
          retention30Days: parseFloat(retention30DayRate as any),
          activeUsers30Days: active30Days,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching demographics analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch demographics analytics' }, { status: 500 });
  }
}
