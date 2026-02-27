/**
 * Push Notification Service
 * Sends push notifications via Web Push API and Firebase Cloud Messaging
 */

import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import mongoose from 'mongoose';

interface PushNotificationOptions {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  actionUrl?: string;
}

interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function getPushSubscriptionModel() {
  if (mongoose.models.PushSubscription) {
    return mongoose.models.PushSubscription;
  }

  const PushSubscriptionSchema = new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      endpoint: { type: String, required: true, unique: true },
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
      userAgent: { type: String },
    },
    { timestamps: true }
  );

  return mongoose.model('PushSubscription', PushSubscriptionSchema);
}

/**
 * Send push notification via service worker
 * Uses Push API for web push notifications
 */
export async function sendPushNotification(options: PushNotificationOptions): Promise<boolean> {
  try {
    await connectToDatabase();

    const user = await User.findById(options.userId).select('push_notifications');
    if (user && user.push_notifications === false) {
      return false;
    }

    // Only send if push notifications are enabled
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.warn('Push notifications not configured (missing VAPID key)');
      return false;
    }

    // Get user's push subscriptions from database
    const subscriptions = await getUserPushSubscriptions(options.userId);

    if (subscriptions.length === 0) {
      return false;
    }

    // Send to each active subscription
    const results = await Promise.all(
      subscriptions.map((subscription) => sendToSubscription(subscription, options))
    );

    return results.some((r) => r === true);
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Get user's push subscriptions from database
 */
async function getUserPushSubscriptions(userId: string): Promise<any[]> {
  try {
    await connectToDatabase();

    const PushSubscription = getPushSubscriptionModel();
    const subscriptions = (await PushSubscription.find({
      user: new mongoose.Types.ObjectId(userId),
    }).lean()) as StoredPushSubscription[];

    return subscriptions.map((subscription) => ({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }));
  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return [];
  }
}

/**
 * Send notification to a specific subscription
 */
async function sendToSubscription(
  subscription: any,
  options: PushNotificationOptions
): Promise<boolean> {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return false;
    }

    // Import web-push library
    let webpush: any;
    try {
      webpush = await import('web-push');
    } catch (e) {
      console.error('web-push not installed:', e);
      return false;
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:notifications@superteambrazil.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    const payload = {
      title: options.title,
      body: options.body,
      icon: options.icon || '/android-chrome-192x192.png',
      badge: options.badge || '/favicon-32x32.png',
      tag: options.tag || 'notification',
      data: {
        url: options.actionUrl || '/',
      },
    };

    await webpush.sendNotification(subscription, JSON.stringify(payload));

    return true;
  } catch (error: any) {
    // Handle subscription errors (expired, invalid, etc.)
    if (error.statusCode === 410) {
      // Subscription expired - delete from database
      await deletePushSubscription(subscription.endpoint);
    }

    console.error('Error sending to subscription:', error.message);
    return false;
  }
}

/**
 * Delete expired push subscription
 */
async function deletePushSubscription(endpoint: string): Promise<void> {
  try {
    await connectToDatabase();
    const PushSubscription = getPushSubscriptionModel();
    await PushSubscription.deleteOne({ endpoint });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
  }
}

/**
 * Send push notification for comment reply
 */
export async function pushNotifyCommentReply(
  userId: string,
  replierName: string,
  postTitle: string,
  postId: string
): Promise<boolean> {
  return sendPushNotification({
    userId,
    title: 'New comment on your post',
    body: `${replierName} replied to "${postTitle}"`,
    actionUrl: `/community/${postId}`,
    tag: `post-${postId}`,
  });
}

/**
 * Send push notification for post like
 */
export async function pushNotifyPostLike(
  userId: string,
  likerName: string,
  postTitle: string,
  postId: string
): Promise<boolean> {
  return sendPushNotification({
    userId,
    title: 'New like on your post',
    body: `${likerName} liked "${postTitle}"`,
    actionUrl: `/community/${postId}`,
    tag: `post-like-${postId}`,
  });
}

/**
 * Send push notification for comment like
 */
export async function pushNotifyCommentLike(
  userId: string,
  likerName: string,
  postId: string
): Promise<boolean> {
  return sendPushNotification({
    userId,
    title: 'New like on your comment',
    body: `${likerName} liked your comment`,
    actionUrl: `/community/${postId}`,
    tag: `comment-like-${postId}`,
  });
}

/**
 * Send push notification for @mention
 */
export async function pushNotifyMention(
  userId: string,
  mentionerName: string,
  contentType: 'post' | 'comment',
  contentUrl: string
): Promise<boolean> {
  return sendPushNotification({
    userId,
    title: 'You were mentioned',
    body: `${mentionerName} mentioned you in a ${contentType}`,
    actionUrl: contentUrl,
    tag: `mention-${Date.now()}`,
  });
}

/**
 * Send push notification for achievement unlock
 */
export async function pushNotifyAchievement(
  userId: string,
  achievementName: string
): Promise<boolean> {
  return sendPushNotification({
    userId,
    title: '🏆 Achievement Unlocked!',
    body: `You unlocked "${achievementName}"`,
    actionUrl: '/dashboard/achievements',
    tag: `achievement-${achievementName}`,
  });
}

/**
 * Send push notification for XP reward
 */
export async function pushNotifyXPReward(
  userId: string,
  xpAmount: number,
  reason: string
): Promise<boolean> {
  return sendPushNotification({
    userId,
    title: '⭐ XP Earned!',
    body: `You earned ${xpAmount} XP for ${reason}`,
    actionUrl: '/dashboard/profile',
    tag: `xp-reward-${Date.now()}`,
  });
}
