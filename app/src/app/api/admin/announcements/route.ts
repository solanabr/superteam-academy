import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User, CommunityPost, AuditLog } from '@/models';
import { logAction } from '@/lib/services/audit-log.service';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Verify admin role
    const admin = await User.findById(session.user.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, active, archived

    // Build query
    const query: any = {
      is_announcement: true,
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const totalCount = await CommunityPost.countDocuments(query);

    // Get announcements with pagination
    const announcements = await CommunityPost.find(query)
      .sort({ is_pinned: -1, created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'display_name avatar_url')
      .lean();

    // Calculate stats
    const stats = {
      totalAnnouncements: totalCount,
      activeAnnouncements: await CommunityPost.countDocuments({
        ...query,
        is_pinned: false,
      }),
      pinnedAnnouncements: await CommunityPost.countDocuments({
        ...query,
        is_pinned: true,
      }),
      totalViews:
        (
          await CommunityPost.aggregate([
            { $match: query },
            { $group: { _id: null, totalViews: { $sum: '$views_count' } } },
          ])
        )[0]?.totalViews || 0,
    };

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Verify admin role
    const admin = await User.findById(session.user.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, content, announcementType, isPinned } = await request.json();

    // Validation
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content must be 5000 characters or less' },
        { status: 400 }
      );
    }

    // Create announcement as a community post
    const announcement = await CommunityPost.create({
      title,
      content,
      author: session.user.id,
      category: 'Announcements',
      is_announcement: true,
      is_pinned: isPinned || false,
      replies_count: 0,
      likes_count: 0,
      views_count: 0,
    });

    // Log audit entry
    await logAction({
      action: 'Announcement Created',
      userId: session.user.id,
      userName: admin.display_name,
      resource: 'other',
      resourceId: announcement._id.toString(),
      resourceName: title,
      description: `Created announcement: ${title}`,
      changes: {
        title,
        isPinned,
      },
      status: 'success',
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Verify admin role
    const admin = await User.findById(session.user.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, title, content, isPinned } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    // Find announcement
    const announcement = await CommunityPost.findById(id);
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    if (!announcement.is_announcement) {
      return NextResponse.json({ error: 'Post is not an announcement' }, { status: 400 });
    }

    // Update announcement
    const updatedAnnouncement = await CommunityPost.findByIdAndUpdate(
      id,
      {
        title: title || announcement.title,
        content: content || announcement.content,
        is_pinned: isPinned !== undefined ? isPinned : announcement.is_pinned,
      },
      { returnDocument: 'after' }
    );

    // Log audit entry
    await logAction({
      action: 'Announcement Updated',
      userId: session.user.id,
      userName: admin.display_name,
      resource: 'other',
      resourceId: id,
      resourceName: title || announcement.title,
      description: `Updated announcement: ${title || announcement.title}`,
      changes: {
        oldIsPinned: announcement.is_pinned,
        newIsPinned: isPinned,
      },
      status: 'success',
    });

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Verify admin role
    const admin = await User.findById(session.user.id);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    // Find announcement
    const announcement = await CommunityPost.findById(id);
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    if (!announcement.is_announcement) {
      return NextResponse.json({ error: 'Post is not an announcement' }, { status: 400 });
    }

    // Delete announcement
    await CommunityPost.findByIdAndDelete(id);

    // Log audit entry
    await logAction({
      action: 'Announcement Deleted',
      userId: session.user.id,
      userName: admin.display_name,
      resource: 'other',
      resourceId: id,
      resourceName: announcement.title,
      description: `Deleted announcement: ${announcement.title}`,
      status: 'success',
    });

    return NextResponse.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
