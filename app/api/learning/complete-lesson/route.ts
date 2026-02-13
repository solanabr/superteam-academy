import { NextRequest, NextResponse } from 'next/server';
import { getCourseLessonTotal } from '@/lib/data/courses';
import { getSessionFromRequest } from '@/lib/auth/server-session';
import { fallbackLessonXpAward, resolveLessonXpAward } from '@/lib/learning/course-xp';
import { getStoredProgress, getStoredStreak } from '@/lib/learning/server-progress-store';
import { learningTransactionRelay } from '@/lib/learning/server-transaction-relay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CompleteLessonBody {
  courseId?: string;
  lessonIndex?: number;
  xpAward?: number;
}

function parseLessonIndex(input: unknown): number | null {
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: CompleteLessonBody;

  try {
    body = (await request.json()) as CompleteLessonBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const courseId = body.courseId?.trim();
  const lessonIndex = parseLessonIndex(body.lessonIndex);

  if (!courseId || lessonIndex === null) {
    return NextResponse.json({ error: 'courseId and lessonIndex are required' }, { status: 400 });
  }

  const resolvedXp = await resolveLessonXpAward(courseId, lessonIndex);
  const xpAward = body.xpAward === undefined ? resolvedXp : fallbackLessonXpAward(body.xpAward);

  const result = await learningTransactionRelay.completeLesson({
    userId: session.user.id,
    courseId,
    lessonIndex,
    xpAward
  });

  const totalLessons = await getCourseLessonTotal(courseId);
  const [progress, streak] = await Promise.all([
    getStoredProgress(session.user.id, courseId, totalLessons),
    getStoredStreak(session.user.id)
  ]);

  return NextResponse.json({
    ok: true,
    alreadyCompleted: result.alreadyCompleted,
    xpAwarded: result.xpAwarded,
    totalXP: result.totalXP,
    streak,
    progress,
    tx: result.receipt
  });
}
