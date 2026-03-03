/**
 * GET /api/courses
 *
 * Public endpoint — fetches all courses from the on-chain program.
 * Supports query params: ?active=true, ?track=1, ?creator=<pubkey>
 */
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getRpcUrl, safeErrorDetails } from '@/context/env';
import {
    fetchAllCourses,
    fetchActiveCourses,
    fetchCoursesByTrack,
    fetchCoursesByCreator,
} from '@/context/solana/course-service';

/**
 * Validate that a string is a valid Solana base58 public key.
 */
function isValidPubkey(value: string): boolean {
    try {
        new PublicKey(value);
        return true;
    } catch {
        return false;
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Rate limiting
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') ?? '127.0.0.1';
        const { success, response } = await checkRateLimit(`courses:${ip}`);
        if (!success) return response as NextResponse;

        const connection = new Connection(getRpcUrl(), 'confirmed');
        const { searchParams } = new URL(request.url);

        const active = searchParams.get('active');
        const trackId = searchParams.get('track');
        const creator = searchParams.get('creator');

        let courses;

        if (trackId) {
            const parsed = parseInt(trackId, 10);
            if (isNaN(parsed) || parsed < 0 || parsed > 65535) {
                return NextResponse.json(
                    { error: 'Invalid track ID. Must be a number 0-65535.' },
                    { status: 400 }
                );
            }
            courses = await fetchCoursesByTrack(connection, parsed);
        } else if (creator) {
            if (!isValidPubkey(creator)) {
                return NextResponse.json(
                    { error: 'Invalid creator address. Must be a valid Solana public key.' },
                    { status: 400 }
                );
            }
            courses = await fetchCoursesByCreator(connection, creator);
        } else if (active === 'true') {
            courses = await fetchActiveCourses(connection);
        } else {
            courses = await fetchAllCourses(connection);
        }

        return NextResponse.json({ courses, count: courses.length });
    } catch (error: unknown) {
        console.error('Failed to fetch courses:', error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: 'Failed to fetch courses', details: safeErrorDetails(error) },
            { status: 500 }
        );
    }
}

