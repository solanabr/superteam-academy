import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]
 * Get user by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await UserService.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Respect privacy settings
    if (!user.profile_public) {
      return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
    }

    const rankData = await UserService.getUserRank(id);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        totalXp: user.total_xp,
        level: user.level,
      },
      rank: rankData,
    });
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/users/[id]
 * Update user profile and settings
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate allowed fields
    const allowedFields = [
      'username',
      'display_name',
      'avatar_url',
      'language',
      'theme',
      'show_on_leaderboard',
      'show_profile',
      'email_notifications',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = await UserService.updateUser(id, updateData);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        avatarUrl: user.avatar_url,
        walletAddress: user.wallet_address,
        totalXp: user.total_xp,
        level: user.level,
        language: user.language,
        theme: user.theme,
        showOnLeaderboard: user.show_on_leaderboard,
        showProfile: user.profile_public,
        emailNotifications: user.email_notifications,
      },
    });
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
