import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models';
import { UserActivity } from '@/models/UserActivity';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    await connectToDatabase();
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId') || '';
    const activityType = searchParams.get('activityType') || '';
    const resource = searchParams.get('resource') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build filter pipeline
    const filters: any = {};

    // Text search in username, email, description
    if (search.trim()) {
      filters.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { resourceName: { $regex: search, $options: 'i' } },
      ];
    }

    // Activity type filter
    if (activityType && activityType !== 'all') {
      filters.activityType = activityType;
    }

    // Resource filter
    if (resource && resource !== 'all') {
      filters.resource = resource;
    }

    // User ID filter
    if (userId.trim()) {
      filters.userId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) {
        filters.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filters.timestamp.$lte = endDateTime;
      }
    }

    const skip = (page - 1) * limit;
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder;

    // Fetch activities
    const [activities, total] = await Promise.all([
      UserActivity.find(filters).sort(sortObj).skip(skip).limit(limit).lean(),
      UserActivity.countDocuments(filters),
    ]);

    // Get summary statistics
    const summary = await UserActivity.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueResources: { $addToSet: '$resource' },
        },
      },
      {
        $project: {
          _id: 0,
          totalActivities: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          uniqueResourceCount: { $size: '$uniqueResources' },
        },
      },
    ]);

    // Get activity type breakdown
    const activityBreakdown = await UserActivity.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get resource type breakdown
    const resourceBreakdown = await UserActivity.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$resource',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get most active users
    const topUsers = await UserActivity.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          email: { $first: '$email' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const summaryStats = summary[0] || {
      totalActivities: 0,
      uniqueUserCount: 0,
      uniqueResourceCount: 0,
    };

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: summaryStats,
      activityBreakdown,
      resourceBreakdown,
      topUsers,
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json({ error: 'Failed to fetch user activities' }, { status: 500 });
  }
}
