import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { OnboardingSession } from '@/models/OnboardingSession';
import {
  awardFirstTimeAchievement,
  getOnboardingProgress,
  isOnboardingComplete,
} from '@/lib/services/onboarding.service';

/**
 * POST /api/onboarding/complete
 * Completes the onboarding flow and awards first-time achievement
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Award achievement
    const achievement = await awardFirstTimeAchievement(session.user.id);

    await OnboardingSession.findOneAndUpdate(
      {
        user_id: session.user.id,
      },
      {
        $set: {
          first_achievement_unlocked: true,
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // Check if onboarding is complete
    const complete = await isOnboardingComplete(session.user.id);

    return NextResponse.json(
      {
        success: true,
        achievement: {
          id: achievement._id,
          name: achievement.achievement_name,
          description: achievement.achievement_description,
          xpReward: achievement.xp_reward,
          earnedAt: achievement.earned_at,
        },
        onboardingComplete: complete,
        message: 'Onboarding completed! Welcome to CapySolBuild 🎉',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}

/**
 * GET /api/onboarding/progress
 * Get current onboarding progress for user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const progress = await getOnboardingProgress(session.user.id);

    return NextResponse.json(progress, { status: 200 });
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding progress' }, { status: 500 });
  }
}
