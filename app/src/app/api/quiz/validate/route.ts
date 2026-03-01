import { NextResponse } from 'next/server';
import { validateQuizAnswers } from '@/lib/quiz-keys';
import { checkRateLimit } from '@/lib/solana/server/rate-limit';

interface QuizValidationRequest {
  courseId: string;
  lessonIndex: number;
  answers: number[];
  wallet: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as QuizValidationRequest;
    const { courseId, lessonIndex, answers, wallet } = body;

    if (
      !courseId ||
      typeof lessonIndex !== 'number' ||
      !Array.isArray(answers) ||
      !wallet
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, lessonIndex, answers, wallet' },
        { status: 400 },
      );
    }

    const rateCheck = checkRateLimit(wallet);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateCheck.retryAfter },
        { status: 429 },
      );
    }

    const result = validateQuizAnswers(courseId, lessonIndex, answers);
    const xpAwarded = result.correct ? 25 : 0;

    return NextResponse.json({
      correct: result.correct,
      score: result.score,
      total: result.total,
      xpAwarded,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
