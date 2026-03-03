/**
 * GET /api/cms/courses
 *
 * Lightweight Sanity CMS course summaries for the listing page.
 * Returns only title, description, thumbnail, and onChainCourseId
 * to minimize payload size for bulk listing enrichment.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export async function GET(): Promise<NextResponse> {
    // ── Mock data mode ──────────────────────────────────────────────────
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        const { MOCK_SANITY_COURSES } = await import('@/mock-data');
        const courses = MOCK_SANITY_COURSES.map((c) => ({
            onChainCourseId: c.onChainCourseId,
            title: c.title,
            description: c.description,
            thumbnail: null,
        }));
        return NextResponse.json({ courses });
    }
    // ── Real data ───────────────────────────────────────────────────────

    if (!PROJECT_ID) {
        // Sanity not configured — return empty list (courses fall back to courseId display)
        return NextResponse.json({ courses: [] });
    }

    try {
        const client = createClient({
            projectId: PROJECT_ID,
            dataset: DATASET,
            apiVersion: '2025-01-01',
            useCdn: true,
            perspective: 'published',
        });

        const builder = imageUrlBuilder(client);

        // Lightweight GROQ — only fields needed for course cards
        const sanityCourses = await client.fetch<Array<{
            onChainCourseId: string;
            title: string;
            description: string;
            thumbnail: { asset: { _ref: string } } | null;
        }>>(
            `*[_type == "course" && isPublished == true] {
                onChainCourseId,
                title,
                description,
                thumbnail
            }`
        );

        // Resolve thumbnail URLs server-side so client doesn't need Sanity SDK
        const courses = sanityCourses.map((c) => ({
            onChainCourseId: c.onChainCourseId,
            title: c.title,
            description: c.description,
            thumbnail: c.thumbnail
                ? builder.image(c.thumbnail).width(600).height(400).auto('format').url()
                : null,
        }));

        return NextResponse.json(
            { courses },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                },
            }
        );
    } catch (error) {
        console.error('[CMS] Failed to fetch course summaries:', error);
        return NextResponse.json({ courses: [] });
    }
}
