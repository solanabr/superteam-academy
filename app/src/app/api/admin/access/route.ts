import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models';
import { hasAdminAllowlist, isAllowlistedAdmin } from '@/lib/admin-access';

const ACCESS_ROLES = ['super_admin', 'admin', 'instructor', 'moderator', 'user'] as const;

type AccessRole = (typeof ACCESS_ROLES)[number];

async function authorizeAdminSession() {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const allowlistEnabled = hasAdminAllowlist();
  if (
    allowlistEnabled &&
    !isAllowlistedAdmin({ id: session.user.id, email: session.user.email })
  ) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
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
      return {
        ok: false as const,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    const adminUser = await User.findOne({ $or: adminLookupFilters }).select('role is_active').lean();
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role) || adminUser.is_active === false) {
      return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
  }

  return { ok: true as const, session };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authorizeAdminSession();
    if (!authResult.ok) {
      return authResult.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10)));
    const role = searchParams.get('role');
    const active = searchParams.get('active');
    const search = (searchParams.get('search') || '').trim();

    const filters: Record<string, unknown> = {};

    if (role && role !== 'all' && ACCESS_ROLES.includes(role as AccessRole)) {
      filters.role = role;
    }

    if (active === 'true') {
      filters.is_active = true;
    }

    if (active === 'false') {
      filters.is_active = false;
    }

    if (search) {
      filters.$or = [
        { username: { $regex: search, $options: 'i' } },
        { display_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total, statsRaw] = await Promise.all([
      User.find(filters)
        .select('_id username email display_name role is_active created_at last_activity_at')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filters),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      super_admin: 0,
      admin: 0,
      instructor: 0,
      moderator: 0,
      user: 0,
    };

    for (const item of statsRaw) {
      if (item?._id && Object.prototype.hasOwnProperty.call(stats, item._id)) {
        stats[item._id as keyof typeof stats] = item.count;
      }
    }

    return NextResponse.json({
      stats,
      users: users.map((user) => ({
        ...user,
        _id: user._id.toString(),
        id: user._id.toString(),
        is_active: user.is_active !== false,
        last_login: user.last_activity_at ? new Date(user.last_activity_at).toISOString() : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching access control data:', error);
    return NextResponse.json({ error: 'Failed to fetch access control data' }, { status: 500 });
  }
}
