import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamification-service';
import { XPTransactionType } from '@/types/gamification';

interface AwardBody {
  amount: number;
  reason?: string;
}

const REASON_TO_TYPE: Record<string, XPTransactionType> = {
  challenge_completion: 'challenge_complete',
  lesson_completion: 'lesson_complete',
  course_completion: 'course_complete',
  activity: 'daily_first',
  bonus: 'bonus',
};

/**
 * POST /api/gamification/award - Award XP directly
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as AwardBody;
    const { amount, reason = 'activity' } = body;

    if (!amount || amount < 0) {
      return NextResponse.json({ error: 'Invalid XP amount' }, { status: 400 });
    }

    // Cap at reasonable max to prevent abuse
    const xpAmount = Math.min(amount, 1000);
    const xpType = REASON_TO_TYPE[reason] || 'bonus';
    const description = `XP awarded for ${reason.replace('_', ' ')}`;

    // Award XP
    const xpResult = await GamificationService.awardXP(
      session.user.id,
      xpAmount,
      xpType,
      `award-${Date.now()}`,
      description
    );

    // Record activity for streak
    const streakResult = await GamificationService.recordActivity(session.user.id);

    // Check for new achievements
    const newAchievements = await GamificationService.checkAndUnlockAchievements(session.user.id);

    return NextResponse.json({
      success: true,
      xp: xpResult,
      streak: streakResult.streak,
      newAchievements,
    });
  } catch (error) {
    console.error('Error awarding XP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
