/**
 * GET /api/cms/course?courseId=<onChainCourseId>
 *
 * Server-side proxy for Sanity CMS course lookups.
 * This avoids CORS issues from client-side @sanity/client requests.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cms } from '@/backend/cms/sanity';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const courseId = request.nextUrl.searchParams.get('courseId');
    if (!courseId) {
        return NextResponse.json({ error: 'courseId parameter required' }, { status: 400 });
    }

    try {
        const course = await cms.getCourseByOnChainId(courseId);
        return NextResponse.json({ course });
    } catch (error) {
        console.error('[CMS] Failed to fetch course:', error);
        return NextResponse.json({ error: 'Failed to fetch from CMS' }, { status: 500 });
    }
}
