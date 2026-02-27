import { NextRequest, NextResponse } from 'next/server';
import { ProgressService } from '@/services/progress.service';
import { UserService } from '@/services/user.service';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/streak/[userId]
 * Get streak data for a user
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

    const streakData = await ProgressService.getStreakData(userId);

    if (!streakData) {
      return NextResponse.json({ error: 'Streak data not found' }, { status: 404 });
    }

    return NextResponse.json({
      streak: streakData,
    });
  } catch (error) {
    console.error('GET /api/streak/[userId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/streak/[userId]
 * Record daily activity (update streak)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

    // Verify user exists
    const user = await UserService.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update streak
    const streak = await ProgressService.updateStreak(userId);

    return NextResponse.json({
      success: true,
      streak: {
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        lastActivityDate: streak.last_activity_date,
      },
    });
  } catch (error) {
    console.error('POST /api/streak/[userId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
