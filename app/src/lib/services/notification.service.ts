/**
 * Notification Service
 * Creates and manages user notifications for community interactions
 */
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { sendNotificationEmail } from '@/lib/services/email.service';
import { sendPushNotification } from '@/lib/services/push.service';

export type NotificationType =
  | 'achievement'
  | 'course'
  | 'message'
  | 'social'
  | 'xp'
  | 'reward'
  | 'system';

interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
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

function isNotificationTypeEnabled(
  type: NotificationType,
  preferences: NotificationPreferences,
  title?: string,
  message?: string
): boolean {
  if (type === 'course') {
    return preferences.course_updates;
  }

  if (type === 'achievement') {
    return true;
  }

  if (type === 'xp' || type === 'reward') {
    return preferences.leaderboard_updates;
  }

  if (type === 'system') {
    const normalizedText = `${title || ''} ${message || ''}`.toLowerCase();

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

interface INotification {
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

// Get or create Notification model
function getNotificationModel(): any {
  if (mongoose.models.Notification) {
    return mongoose.models.Notification;
  }

  const schema = new mongoose.Schema<INotification>(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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

  return mongoose.model<INotification>('Notification', schema);
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    await connectToDatabase();
    const Notification = getNotificationModel();
    const User = mongoose.models.User;

    // Convert userId to ObjectId if it's a string
    const userObjectId =
      typeof params.userId === 'string'
        ? new mongoose.Types.ObjectId(params.userId)
        : params.userId;

    const user = User
      ? await User.findById(userObjectId).select('notification_preferences email display_name')
      : null;
    const preferences = resolveNotificationPreferences(user?.notification_preferences);

    if (!isNotificationTypeEnabled(params.type, preferences, params.title, params.message)) {
      return false;
    }

    await Notification.create({
      user: userObjectId,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      isRead: false,
    });

    const deliveryTasks: Promise<unknown>[] = [];

    if (user?.email) {
      deliveryTasks.push(
        sendNotificationEmail({
          userEmail: user.email,
          userName: user.display_name || 'Learner',
          title: params.title,
          message: params.message,
          actionUrl: params.actionUrl,
          actionLabel: params.actionLabel,
        })
      );
    }

    deliveryTasks.push(
      sendPushNotification({
        userId: userObjectId.toString(),
        title: params.title,
        body: params.message,
        actionUrl: params.actionUrl || '/notifications',
        tag: `notification-${params.type}-${Date.now()}`,
      })
    );

    await Promise.allSettled(deliveryTasks);

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Create a notification for a new comment on a post
 */
export async function notifyPostComment(
  postAuthorId: string | mongoose.Types.ObjectId,
  commentAuthorName: string,
  postTitle: string,
  postId: string
): Promise<void> {
  await createNotification({
    userId: postAuthorId,
    type: 'social',
    title: 'New comment on your post',
    message: `${commentAuthorName} commented on "${postTitle}"`,
    actionUrl: `/community/${postId}`,
    actionLabel: 'View Comment',
  });
}

/**
 * Create a notification for a like on a post
 */
export async function notifyPostLike(
  postAuthorId: string | mongoose.Types.ObjectId,
  likerName: string,
  postTitle: string,
  postId: string
): Promise<void> {
  await createNotification({
    userId: postAuthorId,
    type: 'social',
    title: 'New like on your post',
    message: `${likerName} liked your post "${postTitle}"`,
    actionUrl: `/community/${postId}`,
    actionLabel: 'View Post',
  });
}

/**
 * Create a notification for a like on a comment
 */
export async function notifyCommentLike(
  commentAuthorId: string | mongoose.Types.ObjectId,
  likerName: string,
  postId: string
): Promise<void> {
  await createNotification({
    userId: commentAuthorId,
    type: 'social',
    title: 'New like on your comment',
    message: `${likerName} liked your comment`,
    actionUrl: `/community/${postId}`,
    actionLabel: 'View Comment',
  });
}

/**
 * Create notifications for users mentioned in content
 */
export async function notifyMentions(
  mentionedUserIds: string[],
  mentionerName: string,
  contentType: 'post' | 'comment',
  actionUrl: string
): Promise<void> {
  const notifications = mentionedUserIds.map((userId) =>
    createNotification({
      userId,
      type: 'social',
      title: 'You were mentioned',
      message: `${mentionerName} mentioned you in a ${contentType}`,
      actionUrl,
      actionLabel: `View ${contentType}`,
    })
  );

  await Promise.all(notifications);
}

/**
 * Extract @mentions from text content
 * Returns array of usernames (without @ symbol)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Find user IDs from usernames
 */
export async function findUserIdsByUsernames(usernames: string[]): Promise<string[]> {
  try {
    await connectToDatabase();
    const User = mongoose.models.User;

    if (!User || usernames.length === 0) return [];

    const users = await User.find({
      display_name: { $in: usernames },
    }).select('_id');

    return users.map((user: any) => user._id.toString());
  } catch (error) {
    console.error('Error finding users by usernames:', error);
    return [];
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    await connectToDatabase();
    const Notification = getNotificationModel();

    const count = await Notification.countDocuments({
      user: new mongoose.Types.ObjectId(userId) as any,
      isRead: false,
    } as any);

    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const Notification = getNotificationModel();

    await Notification.updateMany(
      { user: new mongoose.Types.ObjectId(userId), isRead: false } as any,
      { $set: { isRead: true } } as any
    );

    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
}
