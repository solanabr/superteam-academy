import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Course, CourseEnrollment, Challenge, PlatformNotification } from '@/models';
import mongoose from 'mongoose';
import { hasAdminAllowlist, isAllowlistedAdmin } from '@/lib/admin-access';

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export async function GET() {
  try {
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

      const adminUser = await User.findOne({ $or: adminLookupFilters }).select('role').lean();
      if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const [
      totalCourses,
      activeUsers,
      totalEnrollments,
      completedEnrollments,
      totalUsers,
      totalChallenges,
      totalNotifications,
      currentPeriodUsers,
      previousPeriodUsers,
    ] = await Promise.all([
      Course.countDocuments(),
      User.countDocuments({ last_activity_at: { $gte: thirtyDaysAgo } }),
      CourseEnrollment.countDocuments(),
      CourseEnrollment.countDocuments({ completed_at: { $exists: true, $ne: null } }),
      User.countDocuments(),
      Challenge.countDocuments(),
      PlatformNotification.countDocuments(),
      User.countDocuments({ created_at: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
    ]);

    const growthRate = calculateGrowthRate(currentPeriodUsers, previousPeriodUsers);
    const completionRate =
      totalEnrollments > 0 ? Number(((completedEnrollments / totalEnrollments) * 100).toFixed(1)) : 0;

    return NextResponse.json(
      {
        stats: {
          totalCourses,
          activeUsers,
          growthRate,
          completionRate,
        },
        snapshot: {
          totalUsers,
          totalEnrollments,
          totalChallenges,
          totalNotifications,
        },
        lastUpdatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
