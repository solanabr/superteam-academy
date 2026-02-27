import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CommunityComment, CommunityPost } from '@/models';
import {
  notifyPostComment,
  notifyMentions,
  extractMentions,
  findUserIdsByUsernames,
} from '@/lib/services/notification.service';
import mongoose from 'mongoose';

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

    const comments = await CommunityComment.find({ post_id: id })
      .populate('author_id', 'display_name avatar_url level')
      .sort({ created_at: -1 });

    const formattedComments = comments.map((comment: any) => ({
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
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error('Get Comments API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    // Verify post exists
    const post = await CommunityPost.findById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length < 2) {
      return NextResponse.json({ error: 'Comment must be at least 2 characters' }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be less than 2000 characters' },
        { status: 400 }
      );
    }

    const comment = await CommunityComment.create({
      post_id: id,
      author_id: session.user.id,
      content: content.trim(),
      likes_count: 0,
    });

    // Increment replies count on post
    await CommunityPost.findByIdAndUpdate(id, { replies_count: post.replies_count + 1 });

    // Populate author info
    await comment.populate('author_id', 'display_name avatar_url level');

    // Notify post author (if not commenting on own post)
    if (post.author.toString() !== session.user.id) {
      await notifyPostComment(post.author, session.user.name || 'Someone', post.title, id);
    }

    // Check for @mentions and notify mentioned users
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      const mentionedUserIds = await findUserIdsByUsernames(mentions);
      const filteredUserIds = mentionedUserIds.filter((userId) => userId !== session.user.id);
      if (filteredUserIds.length > 0) {
        await notifyMentions(
          filteredUserIds,
          session.user.name || 'Someone',
          'comment',
          `/community/${id}`
        );
      }
    }

    const author = comment.author_id as any;
    return NextResponse.json(
      {
        message: 'Comment created successfully',
        comment: {
          id: comment._id.toString(),
          content: comment.content,
          author: {
            id: comment.author_id?._id?.toString(),
            name: author?.display_name || 'Anonymous',
            avatar: author?.avatar_url,
            level: author?.level || 1,
          },
          likes: comment.likes_count,
          createdAt: 'just now',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Comment API Error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
