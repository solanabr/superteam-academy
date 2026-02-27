import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose, { Schema, Document } from 'mongoose';

type NotificationType =
  | 'achievement'
  | 'course'
  | 'message'
  | 'social'
  | 'xp'
  | 'reward'
  | 'system';

interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationPreferences {
  course_updates: boolean;
  streak_reminders: boolean;
  leaderboard_updates: boolean;
  new_challenges: boolean;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  course_updates: true,
  streak_reminders: true,
  leaderboard_updates: false,
  new_challenges: true,
};

function resolveNotificationPreferences(rawPreferences: any): NotificationPreferences {
  return {
    course_updates:
      typeof rawPreferences?.course_updates === 'boolean'
        ? rawPreferences.course_updates
        : DEFAULT_NOTIFICATION_PREFERENCES.course_updates,
    streak_reminders:
      typeof rawPreferences?.streak_reminders === 'boolean'
        ? rawPreferences.streak_reminders
        : DEFAULT_NOTIFICATION_PREFERENCES.streak_reminders,
    leaderboard_updates:
      typeof rawPreferences?.leaderboard_updates === 'boolean'
        ? rawPreferences.leaderboard_updates
        : DEFAULT_NOTIFICATION_PREFERENCES.leaderboard_updates,
    new_challenges:
      typeof rawPreferences?.new_challenges === 'boolean'
        ? rawPreferences.new_challenges
        : DEFAULT_NOTIFICATION_PREFERENCES.new_challenges,
  };
}

function isNotificationEnabledByPreferences(
  notification: INotification,
  preferences: NotificationPreferences
): boolean {
  if (notification.type === 'course') {
    return preferences.course_updates;
  }

  if (notification.type === 'achievement') {
    return true;
  }

  if (notification.type === 'xp' || notification.type === 'reward') {
    return preferences.leaderboard_updates;
  }

  if (notification.type === 'system') {
    const normalizedText = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();

    if (normalizedText.includes('streak')) {
      return preferences.streak_reminders;
    }

    if (normalizedText.includes('challenge')) {
      return preferences.new_challenges;
    }

    if (normalizedText.includes('leaderboard')) {
      return preferences.leaderboard_updates;
    }
  }

  return true;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['achievement', 'course', 'message', 'social', 'xp', 'reward', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    actionUrl: { type: String },
    actionLabel: { type: String },
  },
  { timestamps: true }
);

// Get or create model
const Notification =
  (mongoose.models.Notification as mongoose.Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email && !session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find user
    const User = mongoose.models.User;
    const user = await User.findOne({
      $or: [{ email: session.user.email }, { wallet_address: session.user.walletAddress }],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unread') === 'true';

    // Build query
    const query: any = { user: user._id };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (unreadOnly) {
      query.isRead = false;
    }

    const preferences = resolveNotificationPreferences(user.notification_preferences);

    const rawNotifications = await Notification.find(query).sort({ createdAt: -1 }).limit(200);
    const notifications = rawNotifications
      .filter((notification) => isNotificationEnabledByPreferences(notification, preferences))
      .slice(0, 50);

    // Format notifications
    const formattedNotifications = notifications.map((notif) => ({
      id: notif._id.toString(),
      _id: notif._id.toString(),
      type: notif.type,
      title: notif.title,
      message: notif.message,
      timestamp: getRelativeTime(notif.createdAt),
      createdAt: notif.createdAt,
      isRead: notif.isRead,
      actionUrl: notif.actionUrl,
      actionLabel: notif.actionLabel,
    }));

    return NextResponse.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('Notifications API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email && !session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const User = mongoose.models.User;
    const user = await User.findOne({
      $or: [{ email: session.user.email }, { wallet_address: session.user.walletAddress }],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const notificationId = body.notificationId || body.id;
    const action = body.action || (body.isRead === true ? 'markRead' : undefined);

    if (action === 'markRead') {
      if (notificationId === 'all') {
        await Notification.updateMany(
          { user: user._id, isRead: false },
          { $set: { isRead: true } }
        );
      } else {
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      }
      return NextResponse.json({ message: 'Notification(s) marked as read' });
    }

    if (action === 'delete' && notificationId) {
      await Notification.findByIdAndDelete(notificationId);
      return NextResponse.json({ message: 'Notification deleted' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update Notification API Error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return diffMins <= 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else {
    return Math.floor(diffDays / 7) === 1 ? '1 week ago' : `${Math.floor(diffDays / 7)} weeks ago`;
  }
}
