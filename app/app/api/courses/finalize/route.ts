/**
 * POST /api/courses/finalize
 *
 * Backend-signed course finalization endpoint.
 *
 * Flow:
 * 1. Authenticate the learner via session
 * 2. Validate courseId
 * 3. Fetch course data to resolve creator address
 * 4. Ensure both learner and creator have XP ATAs
 * 5. Build and sign finalizeCourse transaction
 * 6. Return the transaction signature
 *
 * Awards 50% bonus XP to the learner and creator reward XP if threshold met.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { checkRateLimit } from '@/backend/auth/rate-limit';
import { getRpcUrl, safeErrorDetails } from '@/context/env';
import { TransactionBuilder } from '@/context/solana/tx-builder';
import { loadBackendSigner } from '@/context/solana/backend-signer';
import { PROGRAM_ID, XP_MINT } from '@/context/solana/constants';
import { ensureXpAta } from '@/context/solana/xp';
import { fetchCourseById } from '@/context/solana/course-service';
import { prisma } from '@/backend/prisma';
import { getClientIp } from '@/backend/auth/ip';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Rate limiting
        const ip = getClientIp(request);
        const { success, response } = await checkRateLimit(`finalize-course:${ip}`);
        if (!success) return response as NextResponse;

        // Authenticate via NextAuth
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Parse and validate
        const body = await request.json();
        const { courseId, learnerWallet } = body;

        if (!courseId || typeof courseId !== 'string' || courseId.length > 32) {
            return NextResponse.json(
                { error: 'Invalid courseId.' },
                { status: 400 }
            );
        }

        if (!learnerWallet || typeof learnerWallet !== 'string') {
            return NextResponse.json(
                { error: 'Invalid learnerWallet.' },
                { status: 400 }
            );
        }

        let learner: PublicKey;
        try {
            learner = new PublicKey(learnerWallet);
        } catch {
            return NextResponse.json(
                { error: 'Invalid learnerWallet. Not a valid Solana public key.' },
                { status: 400 }
            );
        }

        // Verify wallet ownership
        const linkedAccount = await prisma.linked_accounts.findFirst({
            where: {
                user_id: session.user.id,
                provider: 'wallet',
                provider_id: learnerWallet,
            },
            select: { provider_id: true },
        });

        if (!linkedAccount) {
            return NextResponse.json(
                { error: 'Wallet does not belong to authenticated user.' },
                { status: 403 }
            );
        }

        const connection = new Connection(getRpcUrl(), 'confirmed');
        const backendSigner = loadBackendSigner();

        // Fetch the course to get the creator address
        const course = await fetchCourseById(connection, courseId);
        if (!course) {
            return NextResponse.json(
                { error: 'Course not found.' },
                { status: 404 }
            );
        }

        const creator = new PublicKey(course.creator);

        // Ensure both learner and creator have XP ATAs
        await ensureXpAta(connection, learner, backendSigner);
        await ensureXpAta(connection, creator, backendSigner);

        // Build and execute the finalize_course transaction
        const txBuilder = new TransactionBuilder({
            connection,
            backendSigner,
            programId: PROGRAM_ID,
            xpMint: XP_MINT,
        });

        const result = await txBuilder.finalizeCourse(courseId, learner, creator);

        return NextResponse.json({
            success: true,
            signature: result.signature,
            slot: result.slot,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to finalize course:', message);

        if (message.includes('CourseNotCompleted')) {
            return NextResponse.json(
                { error: 'Not all lessons have been completed.' },
                { status: 400 }
            );
        }
        if (message.includes('CourseAlreadyFinalized')) {
            return NextResponse.json(
                { error: 'Course has already been finalized.' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to finalize course', details: safeErrorDetails(error) },
            { status: 500 }
        );
    }
}
