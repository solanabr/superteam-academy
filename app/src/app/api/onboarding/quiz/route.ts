import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SKILL_ASSESSMENT_QUIZ } from '@/lib/services/onboarding.service';

/**
 * GET /api/onboarding/quiz
 * Returns the skill assessment quiz questions
 */
export async function GET() {
  try {
    // Verify authentication (optional for quiz fetching)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        quiz: SKILL_ASSESSMENT_QUIZ,
        totalQuestions: SKILL_ASSESSMENT_QUIZ.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}
