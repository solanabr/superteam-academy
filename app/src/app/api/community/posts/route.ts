import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CommunityPost, User } from '@/models';
import {
  notifyMentions,
  extractMentions,
  findUserIdsByUsernames,
} from '@/lib/services/notification.service';

function getRelativeTime(date: Date | undefined): string {
  if (!date) {
    return 'Recently';
  }

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

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all' && category !== 'pinned') {
      query.category = category;
    }

    if (category === 'pinned') {
      query.is_pinned = true;
    }

    const posts = await CommunityPost.find(query)
      .populate('author', 'display_name avatar_url level')
      .sort({ is_pinned: -1, created_at: -1 })
      .limit(50);

    // Format posts
    const formattedPosts = posts.map((post: any) => {
      const author = post.author as any;
      const createdAt = post.created_at || post.createdAt || new Date();
      return {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        author: {
          id: post.author._id.toString(),
          name: author?.display_name || 'Anonymous',
          avatar: author?.avatar_url,
          level: author?.level || 1,
        },
        category: post.category,
        replies: post.replies_count,
        likes: post.likes_count,
        views: post.views_count,
        isPinned: post.is_pinned,
        isAnnouncement: post.is_announcement,
        createdAt: getRelativeTime(createdAt),
      };
    });

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Community Posts API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch community posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { title, content, category } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (title.trim().length < 5) {
      return NextResponse.json({ error: 'Title must be at least 5 characters' }, { status: 400 });
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (
      !['Help', 'Discussion', 'Announcements', 'Achievements', 'Study Groups'].includes(category)
    ) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await CommunityPost.create({
      title: title.trim(),
      content: content.trim(),
      author: user._id,
      category,
      is_pinned: false,
      is_announcement: false,
      replies_count: 0,
      likes_count: 0,
      views_count: 0,
    });

    // Check for @mentions and notify mentioned users
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      const mentionedUserIds = await findUserIdsByUsernames(mentions);
      const filteredUserIds = mentionedUserIds.filter((userId) => userId !== session.user.id);
      if (filteredUserIds.length > 0) {
        await notifyMentions(
          filteredUserIds,
          session.user.name || 'Someone',
          'post',
          `/community/${post._id}`
        );
      }
    }

    return NextResponse.json(
      { message: 'Post created successfully', postId: post._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Post API Error:', error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Check if it's a Mongoose validation error
    const errorMessage = (error as any)?.message || 'Failed to create post';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
