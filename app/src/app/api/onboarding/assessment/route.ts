import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import { completeSkillAssessment } from '@/lib/services/onboarding.service';

/**
 * POST /api/onboarding/assessment
 * Completes the skill assessment quiz and returns recommended learning path
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { answers } = await request.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    // Complete assessment and get results
    const result = await completeSkillAssessment(session.user.id, answers);

    return NextResponse.json(
      {
        success: true,
        skillLevel: result.skillLevel,
        learningPath: result.learningPath,
        session: result.session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error completing assessment:', error);
    return NextResponse.json({ error: 'Failed to complete assessment' }, { status: 500 });
  }
}

/**
 * GET /api/onboarding/assessment
 * Get current assessment status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select('total_xp level');

    return NextResponse.json(
      {
        userId: session.user.id,
        userStats: {
          totalXp: user?.total_xp || 0,
          level: user?.level || 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching assessment status:', error);
    return NextResponse.json({ error: 'Failed to fetch assessment status' }, { status: 500 });
  }
}
