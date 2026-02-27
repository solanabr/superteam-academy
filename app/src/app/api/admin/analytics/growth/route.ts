import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { hasAdminAllowlist, isAllowlistedAdmin } from '@/lib/admin-access';

/**
 * GET /api/admin/analytics/growth
 * Returns user growth data over time
 * Query params: period (days, default 30)
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

    // Get period from query params (days)
    const searchParams = request.nextUrl.searchParams;
    const period = parseInt(searchParams.get('period') || '30', 10);

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Get daily registration data
    const dailyRegistrations = await User.aggregate([
      {
        $match: {
          created_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' },
            day: { $dayOfMonth: '$created_at' },
          },
          count: { $sum: 1 },
          cumulative: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    // Get weekly registration data
    const weeklyRegistrations = await User.aggregate([
      {
        $match: {
          created_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            week: { $week: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 },
      },
    ]);

    // Get monthly registration data (last 12 months)
    const last12MonthsStart = new Date();
    last12MonthsStart.setMonth(last12MonthsStart.getMonth() - 12);

    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          created_at: { $gte: last12MonthsStart },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Get cumulative users over time
    const cumulativeUsers = await User.aggregate([
      {
        $sort: { created_at: 1 },
      },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' },
            day: { $dayOfMonth: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    return NextResponse.json(
      {
        period,
        dailyRegistrations,
        weeklyRegistrations,
        monthlyRegistrations,
        cumulativeUsers: cumulativeUsers.slice(-period), // Last N days
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching growth analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch growth analytics' }, { status: 500 });
  }
}
