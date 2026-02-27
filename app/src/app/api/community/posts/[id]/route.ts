import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CommunityPost, CommunityComment, CommunityLike } from '@/models';

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const post = await CommunityPost.findById(id).populate(
      'author',
      'display_name avatar_url level'
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment views
    await CommunityPost.findByIdAndUpdate(id, { views_count: post.views_count + 1 });

    // Get comments
    const comments = await CommunityComment.find({ post_id: id })
      .populate('author_id', 'display_name avatar_url level')
      .sort({ created_at: -1 });

    const author = post.author as any;
    const formattedPost = {
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
      comments: comments.map((comment: any) => ({
        id: comment._id.toString(),
        content: comment.content,
        author: {
          id: comment.author_id?._id?.toString(),
          name: comment.author_id?.display_name || 'Anonymous',
          avatar: comment.author_id?.avatar_url,
          level: comment.author_id?.level || 1,
        },
        likes: comment.likes_count,
        createdAt: getRelativeTime(comment.created_at || new Date()),
      })),
      createdAt: getRelativeTime(post.created_at || new Date()),
    };

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error('Get Post API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}
