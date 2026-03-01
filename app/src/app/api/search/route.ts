import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';

/**
 * GET /api/search?q=<query>
 *
 * Full-text search across courses by title and description.
 * Returns matching courses with basic metadata.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], total: 0 });
  }

  try {
    const courses = await client.fetch<
      Array<{
        _id: string;
        title: string;
        slug: { current: string };
        description: string;
        difficulty: string;
        track: string;
      }>
    >(
      `*[_type == "course" && (title match $q || description match $q)]{
        _id, title, slug, description, difficulty, track
      }[0...20]`,
      { q: `*${query}*` },
    );

    return NextResponse.json({
      results: courses,
      total: courses.length,
      query,
    });
  } catch {
    return NextResponse.json({ results: [], total: 0, query });
  }
}
