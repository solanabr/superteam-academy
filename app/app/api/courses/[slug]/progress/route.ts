import { NextRequest, NextResponse } from 'next/server';
import { getCourseBySlug } from '@/lib/content';

// In-memory progress store
const progressStore = new Map<string, { lessonsCompleted: number[]; lastAccessed: string }>();

function progressKey(slug: string, wallet: string) { return `${slug}:${wallet}`; }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const wallet = request.nextUrl.searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'wallet query parameter required' }, { status: 400 });
  }

  const course = await getCourseBySlug(slug);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const key = progressKey(slug, wallet);
  const progress = progressStore.get(key);

  return NextResponse.json({
    courseId: course.id,
    slug,
    totalLessons: course.lesson_count,
    lessonsCompleted: progress?.lessonsCompleted ?? [],
    percentComplete: progress
      ? Math.round((progress.lessonsCompleted.length / course.lesson_count) * 100)
      : 0,
    lastAccessed: progress?.lastAccessed ?? null,
  });
}
