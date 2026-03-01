import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';

/**
 * GET /api/courses?page=1&limit=10&track=<track>&difficulty=<difficulty>
 *
 * Paginated course listing with optional track and difficulty filters.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '10')));
  const track = url.searchParams.get('track');
  const difficulty = url.searchParams.get('difficulty');

  try {
    const filters = ['_type == "course"'];
    if (track) filters.push('track == $track');
    if (difficulty) filters.push('difficulty == $difficulty');

    const offset = (page - 1) * limit;
    const filterExpr = filters.join(' && ');

    const courses = await client.fetch<
      Array<{
        _id: string;
        title: string;
        slug: { current: string };
        description: string;
        difficulty: string;
        track: string;
        estimatedHours: number;
      }>
    >(
      `*[${filterExpr}] | order(order asc) [${offset}...${offset + limit}]{
        _id, title, slug, description, difficulty, track, estimatedHours
      }`,
      { track, difficulty },
    );

    return NextResponse.json({
      courses,
      page,
      limit,
      hasMore: courses.length === limit,
    });
  } catch {
    return NextResponse.json({ courses: [], page, limit, hasMore: false });
  }
}
