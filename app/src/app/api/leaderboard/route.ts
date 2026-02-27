
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch top 50 users by XP
    const leaderboard = await User.find({})
      .sort({ xp: -1 })
      .limit(50)
      .select('username walletAddress xp level streak achievements');

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
