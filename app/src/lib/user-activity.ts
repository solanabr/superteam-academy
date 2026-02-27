import { UserActivity } from '@/models/UserActivity';
import { connectToDatabase } from '@/lib/mongodb';

export interface LogUserActivityParams {
  userId: string;
  username?: string;
  email?: string;
  activityType:
    | 'login'
    | 'logout'
    | 'course_view'
    | 'course_enrollment'
    | 'lesson_complete'
    | 'challenge_solve'
    | 'post_create'
    | 'comment_create'
    | 'like'
    | 'profile_update'
    | 'settings_update'
    | 'other';
  description: string;
  resource: 'user' | 'course' | 'lesson' | 'challenge' | 'community' | 'profile' | 'other';
  resourceId: string;
  resourceName?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  duration?: number;
}

/**
 * Log a user activity to the database
 * This should be called whenever a user performs an action
 */
export async function logUserActivity(params: LogUserActivityParams) {
  try {
    await connectToDatabase();

    const activity = new UserActivity({
      userId: params.userId,
      username: params.username,
      email: params.email,
      activityType: params.activityType,
      description: params.description,
      resource: params.resource,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
      duration: params.duration,
      timestamp: new Date(),
    });

    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Don't throw - activity logging failures shouldn't break the application
    return null;
  }
}

/**
 * Get activity summary for a user
 */
export async function getUserActivitySummary(userId: string, days: number = 30) {
  try {
    await connectToDatabase();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const summary = await UserActivity.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          uniqueTypes: { $addToSet: '$activityType' },
          uniqueResources: { $addToSet: '$resource' },
        },
      },
    ]);

    return summary[0] || { totalActivities: 0, uniqueTypes: [], uniqueResources: [] };
  } catch (error) {
    console.error('Error getting user activity summary:', error);
    return null;
  }
}

/**
 * Get activity heatmap data (activities by hour)
 */
export async function getActivityHeatmap(userId?: string, days: number = 30) {
  try {
    await connectToDatabase();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filter: any = {
      timestamp: { $gte: startDate },
    };

    if (userId) {
      filter.userId = userId;
    }

    const heatmap = await UserActivity.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            day: { $dayOfWeek: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1, '_id.hour': 1 } },
    ]);

    return heatmap;
  } catch (error) {
    console.error('Error getting activity heatmap:', error);
    return null;
  }
}
