import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserService } from '@/services/user.service';
import { logUserActivity } from '@/lib/user-activity';

/**
 * PATCH /api/users/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate allowed fields for profile update
    const allowedFields = [
      'full_name',
      'username',
      'display_name',
      'avatar_url',
      'bio',
      'location',
      'email',
      'website',
      'twitter',
      'github',
      'linkedin',
      'facebook',
      'instagram',
      'whatsapp',
      'telegram',
      'discord',
      'medium',
      'youtube',
      'tiktok',
      'language',
      'theme',
      'profile_public',
      'show_on_leaderboard',
      'show_activity',
      'email_notifications',
      'push_notifications',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.notification_preferences && typeof body.notification_preferences === 'object') {
      const prefs = body.notification_preferences as Record<string, unknown>;
      const nextNotificationPreferences: Record<string, boolean> = {};

      const preferenceKeys = [
        'course_updates',
        'streak_reminders',
        'leaderboard_updates',
        'new_challenges',
      ];

      for (const key of preferenceKeys) {
        if (typeof prefs[key] === 'boolean') {
          nextNotificationPreferences[key] = prefs[key] as boolean;
        }
      }

      if (Object.keys(nextNotificationPreferences).length > 0) {
        updateData.notification_preferences = nextNotificationPreferences;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = await UserService.updateUser(session.user.id, updateData);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log user activity
    const changedFields = Object.keys(updateData).join(', ');
    logUserActivity({
      userId: session.user.id,
      username: user.username,
      email: user.email,
      activityType: 'profile_update',
      description: `Updated profile fields: ${changedFields}`,
      resource: 'profile',
      resourceId: session.user.id,
      metadata: { changedFields: Object.keys(updateData) },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        full_name: user.full_name,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        website: user.website,
        twitter: user.twitter,
        github: user.github,
        linkedin: user.linkedin,
        facebook: user.facebook,
        instagram: user.instagram,
        whatsapp: user.whatsapp,
        telegram: user.telegram,
        discord: user.discord,
        medium: user.medium,
        youtube: user.youtube,
        tiktok: user.tiktok,
        language: user.language,
        theme: user.theme,
        profile_public: user.profile_public,
        show_on_leaderboard: user.show_on_leaderboard,
        show_activity: user.show_activity,
        email_notifications: user.email_notifications,
        push_notifications: user.push_notifications,
        notification_preferences: {
          course_updates: user.notification_preferences?.course_updates ?? true,
          streak_reminders: user.notification_preferences?.streak_reminders ?? true,
          leaderboard_updates: user.notification_preferences?.leaderboard_updates ?? false,
          new_challenges: user.notification_preferences?.new_challenges ?? true,
        },
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

/**
 * GET /api/users/profile
 * Get current user's profile
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await UserService.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        full_name: user.full_name,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        website: user.website,
        twitter: user.twitter,
        github: user.github,
        linkedin: user.linkedin,
        facebook: user.facebook,
        instagram: user.instagram,
        whatsapp: user.whatsapp,
        telegram: user.telegram,
        discord: user.discord,
        medium: user.medium,
        youtube: user.youtube,
        tiktok: user.tiktok,
        wallet_address: user.wallet_address,
        google_id: user.google_id,
        github_id: user.github_id,
        language: user.language,
        theme: user.theme,
        profile_public: user.profile_public,
        show_on_leaderboard: user.show_on_leaderboard,
        show_activity: user.show_activity,
        email_notifications: user.email_notifications,
        push_notifications: user.push_notifications,
        notification_preferences: {
          course_updates: user.notification_preferences?.course_updates ?? true,
          streak_reminders: user.notification_preferences?.streak_reminders ?? true,
          leaderboard_updates: user.notification_preferences?.leaderboard_updates ?? false,
          new_challenges: user.notification_preferences?.new_challenges ?? true,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
