import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CommunityPost } from '@/models';

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
    const limit = parseInt(searchParams.get('limit') || '5');

    // Fetch announcements
    const announcements = await CommunityPost.find({ is_announcement: true })
      .populate('author', 'display_name avatar_url level')
      .sort({ is_pinned: -1, created_at: -1 })
      .limit(limit);

    const formattedAnnouncements = announcements.map((post: any) => {
      const author = post.author as any;
      const createdAt = post.created_at || post.createdAt || new Date();
      return {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        author: {
          id: post.author._id.toString(),
          name: author?.display_name || 'Admin',
          avatar: author?.avatar_url,
          level: author?.level || 1,
        },
        category: post.category,
        isPinned: post.is_pinned,
        createdAt: getRelativeTime(createdAt),
      };
    });

    return NextResponse.json({ announcements: formattedAnnouncements });
  } catch (error) {
    console.error('Announcements API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}
