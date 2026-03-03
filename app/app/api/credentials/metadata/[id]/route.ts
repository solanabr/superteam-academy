/**
 * GET /api/credentials/metadata/[id]
 *
 * Self-hosted credential metadata endpoint.
 * Serves Metaplex-standard JSON for credential NFTs.
 *
 * This is used as the NFT's metadataUri when Arweave upload
 * is not configured. The [id] parameter is the courseId.
 *
 * Query params:
 *   ?wallet=<base58> — required, the learner's wallet address
 */
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getRpcUrl, safeErrorDetails } from '@/context/env';
import { fetchCourseById } from '@/context/solana/course-service';
import { fetchEnrollment } from '@/context/solana/enrollment-service';
import { buildCredentialMetadata } from '@/backend/certificate/certificate-metadata';
import { TRACK_NAMES } from '@/context/solana/credential-service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: courseId } = await params;
        const wallet = request.nextUrl.searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json(
                { error: 'Missing required query param: wallet' },
                { status: 400 }
            );
        }

        // Validate wallet
        let learner: PublicKey;
        try {
            learner = new PublicKey(wallet);
        } catch {
            return NextResponse.json(
                { error: 'Invalid wallet address' },
                { status: 400 }
            );
        }

        const connection = new Connection(getRpcUrl(), 'confirmed');

        // Fetch course data from on-chain
        const course = await fetchCourseById(connection, courseId);
        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        // Fetch enrollment to verify completion
        const enrollment = await fetchEnrollment(connection, courseId, learner);
        if (!enrollment || !enrollment.completedAt) {
            return NextResponse.json(
                { error: 'Course not completed by this wallet' },
                { status: 404 }
            );
        }

        const trackName = TRACK_NAMES[course.trackId] || 'Solana Developer';
        const credentialName = `${trackName} — Level ${course.trackLevel}`;

        const metadata = buildCredentialMetadata({
            credentialName,
            courseId,
            courseTitle: courseId, // Will be replaced with actual title when Sanity is set up
            trackId: course.trackId,
            level: course.trackLevel,
            coursesCompleted: 1,
            totalXp: course.xpPerLesson * course.lessonCount,
            issuedAt: new Date(enrollment.completedAt * 1000).toISOString().split('T')[0],
        });

        // Return with long cache — metadata is immutable after issuance
        return NextResponse.json(metadata, {
            headers: {
                'Cache-Control': 'public, max-age=86400, immutable',
            },
        });
    } catch (error) {
        console.error('Credential metadata fetch failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch credential metadata', details: safeErrorDetails(error) },
            { status: 500 }
        );
    }
}
