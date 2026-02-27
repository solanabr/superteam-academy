import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { calculateStreak } from '@/lib/streak';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { walletAddress, lessonId, xpEarned } = await req.json();

    if (!walletAddress || !lessonId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update streak on activity
    const { streak } = calculateStreak(user.lastActiveDate, user.streak);
    user.streak = streak;
    user.lastActiveDate = new Date();

    // Idempotency check
    if (!user.completedLessons.includes(lessonId)) {
        user.completedLessons.push(lessonId);
        user.xp += (xpEarned || 0);
        
        // Recalculate level: Level = 1 + floor(xp / 1000)
        user.level = 1 + Math.floor(user.xp / 1000);
        
        await user.save();
    } else {
        // Save anyway to update streak if it changed
        await user.save();
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
