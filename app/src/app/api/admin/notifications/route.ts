import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { PlatformNotification } from '@/models/PlatformNotification';
import { logAction } from '@/lib/services/audit-log.service';

interface SendNotificationRequest {
  title: string;
  message: string;
  description?: string;
  type: 'announcement' | 'alert' | 'update' | 'achievement' | 'maintenance' | 'community';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetUsers?: string[]; // User IDs (if empty, send to all)
  targetRoles?: ('user' | 'instructor' | 'moderator' | 'admin' | 'super_admin')[];
  targetLanguages?: ('en' | 'pt-br' | 'es')[];
  link?: string;
  linkText?: string;
  imageUrl?: string;
  icon?: string;
  isDismissible?: boolean;
  expiresAt?: string; // ISO date string
}

// GET: Fetch notifications (admin view)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user to verify admin role
    const user = await User.findById(session.user.id);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // draft, scheduled, sent, archived
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch notifications
    const notifications = await PlatformNotification.find(filter)
      .sort({ sentAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('sentBy', 'display_name email avatar_url');

    const totalCount = await PlatformNotification.countDocuments(filter);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST: Send notification to all users
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user to verify admin role
    const user = await User.findById(session.user.id);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: SendNotificationRequest = await req.json();

    // Validate required fields
    if (!body.title || !body.message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    if (body.title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be less than 200 characters' },
        { status: 400 }
      );
    }

    if (body.message.length > 1000) {
      return NextResponse.json(
        { error: 'Message must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Build query to find recipient users
    const filter: Record<string, any> = { is_active: true };

    if (body.targetRoles && body.targetRoles.length > 0) {
      filter.role = { $in: body.targetRoles };
    }

    if (body.targetLanguages && body.targetLanguages.length > 0) {
      filter.language = { $in: body.targetLanguages };
    }

    if (body.targetUsers && body.targetUsers.length > 0) {
      filter._id = { $in: body.targetUsers };
    }

    // Get recipient user IDs
    const recipientUsers = await User.find(filter, '_id');
    const recipientUserIds = recipientUsers.map((u) => u._id);

    // Create notification
    const notification = new PlatformNotification({
      title: body.title,
      message: body.message,
      description: body.description,
      type: body.type || 'announcement',
      priority: body.priority || 'medium',
      sentBy: user._id,
      sentByName: user.display_name,
      sentByEmail: user.email,
      targetUsers: body.targetUsers?.length ? body.targetUsers : undefined,
      targetRoles: body.targetRoles || undefined,
      targetLanguages: body.targetLanguages || undefined,
      recipientCount: recipientUserIds.length,
      link: body.link,
      linkText: body.linkText,
      imageUrl: body.imageUrl,
      icon: body.icon,
      isDismissible: body.isDismissible !== false,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      status: 'sent',
      sentAt: new Date(),
    });

    await notification.save();

    // Log audit action
    await logAction({
      userId: user._id.toString(),
      userName: user.display_name,
      userEmail: user.email || '',
      action: 'Notification Sent',
      description: `Sent notification: "${body.title}" to ${recipientUserIds.length} users`,
      resource: 'other',
      resourceId: notification._id.toString(),
      resourceName: body.title,
      changes: {
        recipientCount: recipientUserIds.length,
        type: body.type,
        priority: body.priority,
      },
      status: 'success',
    });

    return NextResponse.json(
      {
        success: true,
        notification,
        recipientCount: recipientUserIds.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending notification:', error);

    // Log as audit failure
    const session = await auth();
    if (session?.user?.id) {
      const user = await User.findById(session.user.id);
      if (user) {
        await logAction({
          userId: user._id.toString(),
          userName: user.display_name,
          userEmail: user.email || '',
          action: 'Notification Send Failed',
          description: `Failed to send notification: ${(error as Error).message}`,
          resource: 'other',
          resourceId: '',
          status: 'failure',
          errorMessage: (error as Error).message,
        });
      }
    }

    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

// PATCH: Update notification status (archive, etc)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      notificationId,
      status,
      title,
      message,
      description,
      type,
      priority,
      targetRoles,
      targetLanguages,
      link,
      linkText,
      imageUrl,
      icon,
      isDismissible,
      expiresAt,
    } = body;

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const existingNotification = await PlatformNotification.findById(notificationId);

    if (!existingNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const isStatusOnlyUpdate =
      status !== undefined &&
      title === undefined &&
      message === undefined &&
      description === undefined &&
      type === undefined &&
      priority === undefined &&
      targetRoles === undefined &&
      targetLanguages === undefined &&
      link === undefined &&
      linkText === undefined &&
      imageUrl === undefined &&
      icon === undefined &&
      isDismissible === undefined &&
      expiresAt === undefined;

    if (isStatusOnlyUpdate) {
      if (!['draft', 'scheduled', 'sent', 'archived'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const notification = await PlatformNotification.findByIdAndUpdate(
        notificationId,
        { status },
        { returnDocument: 'after' }
      );

      if (!notification) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      await logAction({
        userId: user._id.toString(),
        userName: user.display_name,
        userEmail: user.email || '',
        action: 'Notification Status Updated',
        description: `Updated notification status to: ${status}`,
        resource: 'other',
        resourceId: notification._id.toString(),
        resourceName: notification.title,
        changes: {
          oldStatus: existingNotification.status,
          newStatus: status,
        },
        status: 'success',
      });

      return NextResponse.json({
        success: true,
        notification,
      });
    }

    if (title !== undefined && (!title || title.length > 200)) {
      return NextResponse.json(
        { error: 'Title is required and must be less than 200 characters' },
        { status: 400 }
      );
    }

    if (message !== undefined && (!message || message.length > 1000)) {
      return NextResponse.json(
        { error: 'Message is required and must be less than 1000 characters' },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {};

    if (title !== undefined) updatePayload.title = title;
    if (message !== undefined) updatePayload.message = message;
    if (description !== undefined) updatePayload.description = description;
    if (type !== undefined) updatePayload.type = type;
    if (priority !== undefined) updatePayload.priority = priority;
    if (targetRoles !== undefined) updatePayload.targetRoles = targetRoles;
    if (targetLanguages !== undefined) updatePayload.targetLanguages = targetLanguages;
    if (link !== undefined) updatePayload.link = link || undefined;
    if (linkText !== undefined) updatePayload.linkText = linkText || undefined;
    if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl || undefined;
    if (icon !== undefined) updatePayload.icon = icon || undefined;
    if (isDismissible !== undefined) updatePayload.isDismissible = isDismissible;
    if (expiresAt !== undefined) {
      updatePayload.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    }

    if (targetRoles !== undefined || targetLanguages !== undefined) {
      const recipientFilter: Record<string, any> = { is_active: true };
      const effectiveTargetRoles = targetRoles ?? existingNotification.targetRoles;
      const effectiveTargetLanguages = targetLanguages ?? existingNotification.targetLanguages;

      if (effectiveTargetRoles && effectiveTargetRoles.length > 0) {
        recipientFilter.role = { $in: effectiveTargetRoles };
      }

      if (effectiveTargetLanguages && effectiveTargetLanguages.length > 0) {
        recipientFilter.language = { $in: effectiveTargetLanguages };
      }

      const recipientCount = await User.countDocuments(recipientFilter);
      updatePayload.recipientCount = recipientCount;
    }

    const notification = await PlatformNotification.findByIdAndUpdate(notificationId, updatePayload, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await logAction({
      userId: user._id.toString(),
      userName: user.display_name,
      userEmail: user.email || '',
      action: 'Notification Updated',
      description: `Updated notification: "${notification.title}"`,
      resource: 'other',
      resourceId: notification._id.toString(),
      resourceName: notification.title,
      changes: {
        oldValues: {
          title: existingNotification.title,
          message: existingNotification.message,
          type: existingNotification.type,
          priority: existingNotification.priority,
          targetRoles: existingNotification.targetRoles,
          targetLanguages: existingNotification.targetLanguages,
          recipientCount: existingNotification.recipientCount,
        },
        newValues: {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          targetRoles: notification.targetRoles,
          targetLanguages: notification.targetLanguages,
          recipientCount: notification.recipientCount,
        },
      },
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE: Delete notification
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const notification = await PlatformNotification.findByIdAndDelete(notificationId);

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Log audit action
    await logAction({
      userId: user._id.toString(),
      userName: user.display_name,
      userEmail: user.email || '',
      action: 'Notification Deleted',
      description: `Deleted notification: "${notification.title}"`,
      resource: 'other',
      resourceId: notificationId,
      resourceName: notification.title,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
