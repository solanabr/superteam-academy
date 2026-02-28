import { NextResponse } from 'next/server';
import { getCourseBySlug } from '@/lib/content';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Generate lesson list from course data
  const lessons = Array.from({ length: course.lesson_count }, (_, i) => ({
    index: i,
    title: `Lesson ${i + 1}`,
    courseSlug: slug,
    duration: '~30min',
    type: i % 3 === 2 ? 'quiz' : i % 3 === 1 ? 'exercise' : 'lecture',
  }));

  return NextResponse.json({
    courseSlug: slug,
    totalLessons: course.lesson_count,
    lessons,
  });
}
