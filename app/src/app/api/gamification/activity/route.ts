import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamification-service';

/**
 * GET /api/gamification/activity - Get user's streak data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const streak = await GamificationService.getStreakData(session.user.id);

    return NextResponse.json({ streak });
  } catch (error) {
    console.error('Error fetching streak:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/gamification/activity - Record daily activity
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await GamificationService.recordActivity(session.user.id);

    // Check for streak-related achievements
    const newAchievements = await GamificationService.checkAndUnlockAchievements(session.user.id);

    return NextResponse.json({
      ...result,
      newAchievements,
    });
  } catch (error) {
    console.error('Error recording activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
