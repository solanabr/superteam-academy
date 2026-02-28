import { NextRequest, NextResponse } from 'next/server';
import { getCourses, getCoursesByTrack, getCoursesByLevel } from '@/lib/content';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const track = searchParams.get('track');
  const level = searchParams.get('level') as 'beginner' | 'intermediate' | 'advanced' | null;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

  let courses;
  if (track) {
    courses = await getCoursesByTrack(track);
  } else if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) {
    courses = await getCoursesByLevel(level);
  } else {
    courses = await getCourses();
  }

  const total = courses.length;
  const start = (page - 1) * limit;
  const paginated = courses.slice(start, start + limit);

  return NextResponse.json({
    courses: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
