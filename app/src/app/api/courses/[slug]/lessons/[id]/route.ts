import { NextResponse } from 'next/server';
import { CourseService } from '@/services/course.service';

interface RouteParams {
  params: Promise<{ slug: string; id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { slug, id } = await params;
    const lessonData = await CourseService.getLesson(slug, id);

    if (!lessonData) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json(lessonData);
  } catch (error) {
    console.error('GET /api/courses/[slug]/lessons/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
