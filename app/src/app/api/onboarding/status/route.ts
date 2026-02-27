import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isOnboardingComplete } from '@/lib/services/onboarding.service';

/**
 * GET /api/onboarding/status
 *
 * Returns the current user's onboarding status
 * Used by client-side components to verify if user has completed onboarding
 *
 * @returns {object} { isComplete: boolean, requiresRedirect: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const onboardingComplete = await isOnboardingComplete(session.user.id);

    return NextResponse.json({
      isComplete: onboardingComplete,
      requiresRedirect: !onboardingComplete,
      userId: session.user.id,
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // Return success to avoid blocking user - let middleware handle it
    return NextResponse.json({ isComplete: true, requiresRedirect: false }, { status: 200 });
  }
}
