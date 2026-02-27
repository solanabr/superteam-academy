import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models';
import { hasAdminAllowlist, isAllowlistedAdmin } from '@/lib/admin-access';
import { logAction } from '@/lib/services/audit-log.service';

const ACCESS_ROLES = ['super_admin', 'admin', 'instructor', 'moderator', 'user'] as const;

type AccessRole = (typeof ACCESS_ROLES)[number];

type AdminUser = {
  _id: mongoose.Types.ObjectId;
  role: AccessRole;
  is_active?: boolean;
  display_name?: string;
  email?: string;
};

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

  const adminUser = (await User.findOne({ $or: adminLookupFilters })
    .select('_id role is_active display_name email')
    .lean()) as AdminUser | null;

  if (!adminUser) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (
    !allowlistEnabled &&
    (!['admin', 'super_admin'].includes(adminUser.role) || adminUser.is_active === false)
  ) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true as const, session, adminUser };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await authorizeAdminSession();
    if (!authResult.ok) {
      return authResult.response;
    }

    const { userId } = await params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const role = body?.role as AccessRole | undefined;
    const isActive =
      typeof body?.is_active === 'boolean' ? (body.is_active as boolean) : undefined;

    if (role === undefined && isActive === undefined) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    if (role !== undefined && !ACCESS_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const targetUser = await User.findById(userId)
      .select('_id username email display_name role is_active created_at last_activity_at')
      .lean();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentAdmin = authResult.adminUser;

    if (currentAdmin._id.toString() === userId && isActive === false) {
      return NextResponse.json({ error: 'You cannot disable your own account' }, { status: 400 });
    }

    if (role === 'super_admin' && currentAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can grant super admin role' },
        { status: 403 }
      );
    }

    if (
      currentAdmin._id.toString() === userId &&
      currentAdmin.role === 'super_admin' &&
      role !== undefined &&
      role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'You cannot remove your own super admin role' },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {};

    if (role !== undefined) {
      updatePayload.role = role;
    }

    if (isActive !== undefined) {
      updatePayload.is_active = isActive;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, {
      returnDocument: 'after',
      runValidators: true,
    })
      .select('_id username email display_name role is_active created_at last_activity_at')
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    const roleChanged = role !== undefined && role !== targetUser.role;
    const statusChanged = isActive !== undefined && isActive !== (targetUser.is_active !== false);

    let action = 'User Updated';
    let description = `Updated user: ${targetUser.display_name || targetUser.username || targetUser.email || userId}`;

    if (roleChanged && !statusChanged) {
      action = 'User Role Changed';
      description = `Changed role for ${targetUser.display_name || targetUser.username || targetUser.email || userId} to ${updatedUser.role}`;
    } else if (!roleChanged && statusChanged) {
      action = updatedUser.is_active === false ? 'User Disabled' : 'User Enabled';
      description = `${updatedUser.is_active === false ? 'Disabled' : 'Enabled'} user: ${targetUser.display_name || targetUser.username || targetUser.email || userId}`;
    }

    await logAction({
      userId: currentAdmin._id.toString(),
      userName: currentAdmin.display_name,
      userEmail: currentAdmin.email,
      action,
      resource: 'user',
      resourceId: userId,
      resourceName: updatedUser.display_name || updatedUser.username || updatedUser.email,
      description,
      changes: {
        oldValues: {
          role: targetUser.role,
          is_active: targetUser.is_active !== false,
        },
        newValues: {
          role: updatedUser.role,
          is_active: updatedUser.is_active !== false,
        },
      },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        _id: updatedUser._id.toString(),
        id: updatedUser._id.toString(),
        is_active: updatedUser.is_active !== false,
        last_login: updatedUser.last_activity_at
          ? new Date(updatedUser.last_activity_at).toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error('Error updating access control user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
