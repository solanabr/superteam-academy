import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { completeProfileSetup } from '@/lib/services/onboarding.service';

/**
 * POST /api/onboarding/profile
 * Completes the profile setup step
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { bio, avatar_url, website, twitter, github, discord, skip } = await request.json();

    // Validate at least one field is provided unless user explicitly skips this step
    if (!skip && !bio && !avatar_url && !website && !twitter && !github && !discord) {
      return NextResponse.json(
        { error: 'At least one profile field is required' },
        { status: 400 }
      );
    }

    // Complete profile setup
    const session_result = await completeProfileSetup(session.user.id, {
      bio,
      avatar_url,
      website,
      twitter,
      github,
      discord,
    });

    return NextResponse.json(
      {
        success: true,
        session: session_result,
        message: 'Profile setup completed',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error completing profile setup:', error);
    return NextResponse.json({ error: 'Failed to complete profile setup' }, { status: 500 });
  }
}
