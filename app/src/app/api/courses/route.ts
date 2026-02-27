import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '@/services/course.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const difficulty = searchParams.get('difficulty');
    const track = searchParams.get('track');

    let courses = await CourseService.getAllCourses();

    if (q) {
      courses = courses.filter(
        (course) =>
          course.title.toLowerCase().includes(q) ||
          course.description.toLowerCase().includes(q) ||
          (course.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (difficulty && difficulty !== 'all') {
      courses = courses.filter((course) => course.difficulty === difficulty);
    }

    if (track && track !== 'all') {
      courses = courses.filter((course) => course.track === track);
    }

    const tracks = await CourseService.getAllTracks();

    return NextResponse.json({
      courses,
      tracks,
      total: courses.length,
    });
  } catch (error) {
    console.error('GET /api/courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
