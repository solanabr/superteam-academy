import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { hasAdminAllowlist, isAllowlistedAdmin } from '@/lib/admin-access';

/**
 * GET /api/admin/audit
 * Returns audit logs with pagination, filtering, and sorting
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search in description/userName)
 * - action: string (filter by action type)
 * - resource: string (filter by resource type)
 * - status: string (filter by success/failure)
 * - userId: string (filter by user ID)
 * - startDate: ISO string (filter by start date)
 * - endDate: ISO string (filter by end date)
 * - sortBy: string (timestamp, action, resource - default: timestamp)
 * - sortOrder: string (asc, desc - default: desc)
 */
export async function GET(request: NextRequest) {
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

      const adminUser = await User.findOne({ $or: adminLookupFilters }).select('role is_active').lean();
      if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role) || adminUser.is_active === false) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const resource = searchParams.get('resource') || '';
    const status = searchParams.get('status') || '';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
      ];
    }

    if (action) {
      filter.action = action;
    }

    if (resource) {
      filter.resource = resource;
    }

    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    // Date range filtering
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder;

    // Get total count
    const total = await AuditLog.countDocuments(filter);

    // Get paginated logs
    const logs = await AuditLog.find(filter)
      .sort(sortObject)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Get summary stats
    const stats = await AuditLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalActions: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] },
          },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueResources: { $addToSet: '$resource' },
        },
      },
    ]);

    const summary = stats[0] || {
      totalActions: 0,
      successCount: 0,
      failureCount: 0,
      uniqueUsers: [],
      uniqueResources: [],
    };

    // Get action breakdown
    const actionBreakdown = await AuditLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const resourceBreakdown = await AuditLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$resource',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json(
      {
        logs: logs.map((log) => ({
          ...log,
          timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        summary: {
          ...summary,
          uniqueUserCount: summary.uniqueUsers?.length || 0,
          uniqueResourceCount: summary.uniqueResources?.length || 0,
        },
        actionBreakdown,
        resourceBreakdown,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
