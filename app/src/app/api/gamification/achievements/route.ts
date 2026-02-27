import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamification-service';

/**
 * GET /api/gamification/achievements - Get user's achievements
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const achievementData = await GamificationService.getAchievements(session.user.id);

    // Calculate stats
    const total = achievementData.unlocked.length + achievementData.available.length;
    const unlocked = achievementData.unlocked.length;
    const locked = achievementData.available.length;

    // Convert progress Map to object for JSON serialization
    const progressObj: Record<string, number> = {};
    achievementData.progress.forEach((value, key) => {
      progressObj[key] = value;
    });

    return NextResponse.json({
      unlocked: achievementData.unlocked,
      available: achievementData.available,
      progress: progressObj,
      stats: {
        total,
        unlocked,
        locked,
        progressPercent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/gamification/achievements/check - Check and unlock achievements
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newAchievements = await GamificationService.checkAndUnlockAchievements(session.user.id);

    return NextResponse.json({
      newAchievements,
      count: newAchievements.length,
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
