import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { calculateStreak } from '@/lib/streak';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    let user = await User.findOne({ walletAddress });

    if (!user) {
      user = await User.create({
        walletAddress,
        username: `Solanaut-${walletAddress.slice(0, 4)}`,
        xp: 0,
        level: 1,
        streak: 1, // First login is day 1
        lastActiveDate: new Date(),
        achievements: [],
        completedLessons: []
      });
    } else {
        // Calculate streak before updating lastActiveDate
        const { streak } = calculateStreak(user.lastActiveDate, user.streak);
        user.streak = streak;
        
        // Update last active
        user.lastActiveDate = new Date();
        await user.save();
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
