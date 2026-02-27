import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamification-service';
import { createNotification } from '@/lib/services/notification.service';
import { XP_REWARDS, XPTransactionType } from '@/types/gamification';

type CompletionType = 'lesson' | 'course' | 'challenge';

interface CompletionBody {
  type: CompletionType;
  resourceId: string;
  title: string;
  xpAmount?: number; // Custom XP amount (overrides defaults)
  challengeBonus?: number; // Legacy support - deprecated in favor of xpAmount
}

/**
 * POST /api/gamification/complete - Record completion and award XP
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CompletionBody;
    const { type, resourceId, title, xpAmount: customXpAmount, challengeBonus } = body;

    if (!type || !resourceId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let xpAmount: number;
    let xpType: XPTransactionType;
    let description: string;

    switch (type) {
      case 'lesson':
        // Use custom amount if provided, otherwise use minimum
        xpAmount = customXpAmount ?? XP_REWARDS.LESSON_COMPLETE_MIN;
        xpType = 'lesson_complete';
        description = `Completed lesson: ${title}`;
        await GamificationService.incrementLessonsCompleted(session.user.id);
        break;

      case 'course':
        // Use custom amount if provided, otherwise use minimum
        xpAmount = customXpAmount ?? XP_REWARDS.COURSE_COMPLETE_MIN;
        xpType = 'course_complete';
        description = `Completed course: ${title}`;
        await GamificationService.incrementCoursesCompleted(session.user.id);
        break;

      case 'challenge':
        // Support both xpAmount and legacy challengeBonus parameter
        xpAmount = customXpAmount ?? challengeBonus ?? XP_REWARDS.CHALLENGE_COMPLETE_MIN;
        xpType = 'challenge_complete';
        description = `Completed challenge: ${title}`;
        await GamificationService.incrementChallengesCompleted(session.user.id);
        break;

      default:
        return NextResponse.json({ error: 'Invalid completion type' }, { status: 400 });
    }

    // Award XP
    const xpResult = await GamificationService.awardXP(
      session.user.id,
      xpAmount,
      xpType,
      resourceId,
      description
    );

    // Record activity for streak
    const streakResult = await GamificationService.recordActivity(session.user.id);

    // Check for new achievements
    const newAchievements = await GamificationService.checkAndUnlockAchievements(session.user.id);

    await Promise.allSettled([
      createNotification({
        userId: session.user.id,
        type: 'xp',
        title: 'XP Earned',
        message: `You earned ${xpAmount} XP for completing ${type}: ${title}.`,
        actionUrl: '/profile?tab=activity',
        actionLabel: 'View Activity',
      }),
      ...newAchievements.map((achievement) =>
        createNotification({
          userId: session.user.id,
          type: 'achievement',
          title: `Achievement Unlocked: ${achievement.name}`,
          message: `${achievement.description} (+${achievement.xpReward} XP)`,
          actionUrl: '/profile?tab=achievements',
          actionLabel: 'View Achievement',
        })
      ),
    ]);

    return NextResponse.json({
      success: true,
      xp: xpResult,
      streak: streakResult.streak,
      newAchievements,
    });
  } catch (error) {
    console.error('Error recording completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
