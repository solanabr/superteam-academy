import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectToDatabase();

    const User = mongoose.models.User;
    const CommunityPost = mongoose.models.CommunityPost;

    if (!User || !CommunityPost) {
      throw new Error('Models not initialized');
    }

    // Get total members
    const totalMembers = await User.countDocuments();

    // Get active users (logged in within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      last_activity_at: { $gte: oneDayAgo },
    });

    // Get total posts
    const totalPosts = await CommunityPost.countDocuments();

    // Get total replies (sum of replies field)
    const repliesResult = await CommunityPost.aggregate([
      {
        $group: {
          _id: null,
          totalReplies: { $sum: '$replies' },
        },
      },
    ]);

    const totalReplies = repliesResult[0]?.totalReplies || 0;

    return NextResponse.json({
      totalMembers,
      activeUsers,
      totalPosts,
      totalReplies,
    });
  } catch (error) {
    console.error('Community Stats API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch community stats' }, { status: 500 });
  }
}
