import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CommunityComment, CommunityLike } from '@/models';
import { notifyCommentLike } from '@/lib/services/notification.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { commentId } = await params;

    // Verify comment exists
    const comment = await CommunityComment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await CommunityLike.findOne({
      user_id: session.user.id,
      comment_id: commentId,
    });

    if (existingLike) {
      // Unlike
      await CommunityLike.deleteOne({ _id: existingLike._id });
      await CommunityComment.findByIdAndUpdate(commentId, {
        likes_count: comment.likes_count - 1,
      });
      return NextResponse.json({ message: 'Comment unliked', liked: false });
    } else {
      // Like
      await CommunityLike.create({
        user_id: session.user.id,
        comment_id: commentId,
      });
      await CommunityComment.findByIdAndUpdate(commentId, {
        likes_count: comment.likes_count + 1,
      });

      // Notify comment author (if not liking own comment)
      const { id } = await params;
      if (comment.author_id.toString() !== session.user.id) {
        await notifyCommentLike(comment.author_id, session.user.name || 'Someone', id);
      }

      return NextResponse.json({ message: 'Comment liked', liked: true });
    }
  } catch (error) {
    console.error('Like Comment API Error:', error);
    return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ liked: false });
    }

    await connectToDatabase();
    const { commentId } = await params;

    const like = await CommunityLike.findOne({
      user_id: session.user.id,
      comment_id: commentId,
    });

    return NextResponse.json({ liked: !!like });
  } catch (error) {
    console.error('Check Comment Like API Error:', error);
    return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
  }
}
