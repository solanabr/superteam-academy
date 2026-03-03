/**
 * GET /api/courses/[id]
 *
 * Fetch a single course by courseId from the on-chain program.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getRpcUrl, safeErrorDetails } from '@/context/env';
import { fetchCourseById } from '@/context/solana/course-service';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        // Rate limiting
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') ?? '127.0.0.1';
        const { success, response } = await checkRateLimit(`course-detail:${ip}`);
        if (!success) return response as NextResponse;

        const { id: courseId } = await params;

        if (!courseId || courseId.length > 32) {
            return NextResponse.json(
                { error: 'Invalid course ID' },
                { status: 400 }
            );
        }

        const connection = new Connection(getRpcUrl(), 'confirmed');
        const course = await fetchCourseById(connection, courseId);

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ course });
    } catch (error: unknown) {
        console.error('Failed to fetch course:', error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: 'Failed to fetch course', details: safeErrorDetails(error) },
            { status: 500 }
        );
    }
}

