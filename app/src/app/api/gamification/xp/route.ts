import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamification-service';
import { XPTransactionType } from '@/types/gamification';

/**
 * GET /api/gamification/xp - Get user's XP balance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const xp = await GamificationService.getXPBalance(session.user.id);
    const history = await GamificationService.getXPHistory(session.user.id, 20);

    return NextResponse.json({ xp, history });
  } catch (error) {
    console.error('Error fetching XP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/gamification/xp - Award XP (internal use)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, source, description } = body as {
      amount: number;
      type: XPTransactionType;
      source: string;
      description: string;
    };

    if (!amount || !type || !source || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await GamificationService.awardXP(
      session.user.id,
      amount,
      type,
      source,
      description
    );

    // Check for new achievements
    const newAchievements = await GamificationService.checkAndUnlockAchievements(session.user.id);

    return NextResponse.json({
      ...result,
      newAchievements,
    });
  } catch (error) {
    console.error('Error awarding XP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
