import { NextRequest, NextResponse } from 'next/server';
import { validateQuizAnswer } from '@/lib/quiz-keys';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, lessonIndex, answer } = body;

    if (!courseId || lessonIndex === undefined || answer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, lessonIndex, answer' },
        { status: 400 }
      );
    }

    if (typeof lessonIndex !== 'number' || typeof answer !== 'number') {
      return NextResponse.json(
        { error: 'lessonIndex and answer must be numbers' },
        { status: 400 }
      );
    }

    const result = validateQuizAnswer(courseId, lessonIndex, answer);

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Invalid course or lesson index' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      correct: result.correct,
      courseId,
      lessonIndex,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
