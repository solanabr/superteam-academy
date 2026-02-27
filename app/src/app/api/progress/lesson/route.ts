import { NextRequest, NextResponse } from 'next/server';
import { ProgressService } from '@/services/progress.service';

/**
 * GET /api/progress/lesson
 * Check if a specific lesson is completed
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    if (!userId || !courseId || !lessonId) {
      return NextResponse.json(
        { error: 'userId, courseId, and lessonId are required' },
        { status: 400 }
      );
    }

    const progress = await ProgressService.getLessonProgress(userId, courseId, lessonId);

    if (!progress) {
      return NextResponse.json({
        completed: false,
        lessonId,
      });
    }

    return NextResponse.json({
      completed: progress.completed || false,
      completedAt: progress.completed_at,
      xpEarned: progress.xp_earned,
      attempts: progress.attempts,
      lessonId,
    });
  } catch (error) {
    console.error('GET /api/progress/lesson error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
