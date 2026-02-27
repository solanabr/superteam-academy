import { NextRequest, NextResponse } from 'next/server';
import { sanityFetch } from '@/lib/sanity/client';
import { allCoursesQuery, featuredCoursesQuery } from '@/lib/sanity/queries';
import type { SanityCourse } from '@/lib/sanity/types';

/**
 * Get courses from Sanity CMS
 * GET /api/sanity/courses?featured=true
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured') === 'true';

    const query = featured ? featuredCoursesQuery : allCoursesQuery;
    const courses = await sanityFetch<SanityCourse[]>(query);

    return NextResponse.json({
      success: true,
      count: courses?.length || 0,
      courses: courses || [],
    });
  } catch (error) {
    console.error('Error fetching courses from Sanity:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch courses',
        courses: [],
      },
      { status: 500 }
    );
  }
}
