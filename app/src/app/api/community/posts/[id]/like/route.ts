import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { CommunityPost, CommunityComment, CommunityLike } from '@/models';
import { notifyPostLike } from '@/lib/services/notification.service';

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

    // Check if already liked
    const existingLike = await CommunityLike.findOne({
      user_id: session.user.id,
      post_id: id,
    });

    if (existingLike) {
      // Unlike
      await CommunityLike.deleteOne({ _id: existingLike._id });
      await CommunityPost.findByIdAndUpdate(id, { likes_count: post.likes_count - 1 });
      return NextResponse.json({ message: 'Post unliked', liked: false });
    } else {
      // Like
      await CommunityLike.create({
        user_id: session.user.id,
        post_id: id,
      });
      await CommunityPost.findByIdAndUpdate(id, { likes_count: post.likes_count + 1 });

      // Notify post author (if not liking own post)
      if (post.author.toString() !== session.user.id) {
        await notifyPostLike(post.author, session.user.name || 'Someone', post.title, id);
      }

      return NextResponse.json({ message: 'Post liked', liked: true });
    }
  } catch (error) {
    console.error('Like Post API Error:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ liked: false });
    }

    await connectToDatabase();
    const { id } = await params;

    const like = await CommunityLike.findOne({
      user_id: session.user.id,
      post_id: id,
    });

    return NextResponse.json({ liked: !!like });
  } catch (error) {
    console.error('Check Like API Error:', error);
    return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
  }
}
