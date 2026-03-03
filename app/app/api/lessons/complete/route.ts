/**
 * POST /api/lessons/complete
 *
 * Backend-signed lesson completion endpoint.
 *
 * Flow:
 * 1. Authenticate the learner via session
 * 2. Validate courseId and lessonIndex
 * 3. Build and sign completeLesson transaction with backend signer
 * 4. Return the transaction signature
 *
 * The backend signer co-signs this transaction to prevent
 * learners from arbitrarily marking lessons complete (anti-cheat).
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
import { prisma } from '@/backend/prisma';
import { getClientIp } from '@/backend/auth/ip';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Rate limiting — stricter for mutations (5 req/min matches auth pattern)
        const ip = getClientIp(request);
        const { success, response } = await checkRateLimit(`complete-lesson:${ip}`);
        if (!success) return response as NextResponse;

        // Authenticate the learner via NextAuth
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const { courseId, lessonIndex, learnerWallet } = body;

        if (!courseId || typeof courseId !== 'string' || courseId.length > 32) {
            return NextResponse.json(
                { error: 'Invalid courseId. Must be a string of 1-32 characters.' },
                { status: 400 }
            );
        }

        if (typeof lessonIndex !== 'number' || lessonIndex < 0 || lessonIndex > 255) {
            return NextResponse.json(
                { error: 'Invalid lessonIndex. Must be a number 0-255.' },
                { status: 400 }
            );
        }

        if (!learnerWallet || typeof learnerWallet !== 'string') {
            return NextResponse.json(
                { error: 'Invalid learnerWallet. Must be a valid Solana public key.' },
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

        // Verify wallet ownership — prevent User A completing lessons for User B
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

        // Load backend signer and create transaction builder
        const connection = new Connection(getRpcUrl(), 'confirmed');
        const backendSigner = loadBackendSigner();

        // Ensure the learner has an XP ATA (creates one if missing)
        await ensureXpAta(connection, learner, backendSigner);

        // Build and execute the complete_lesson transaction
        const txBuilder = new TransactionBuilder({
            connection,
            backendSigner,
            programId: PROGRAM_ID,
            xpMint: XP_MINT,
        });

        const result = await txBuilder.completeLesson(courseId, lessonIndex, learner);

        return NextResponse.json({
            success: true,
            signature: result.signature,
            slot: result.slot,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to complete lesson:', message);

        // Parse Anchor program errors for better error messages
        if (message.includes('LessonAlreadyCompleted')) {
            return NextResponse.json(
                { error: 'Lesson already completed.' },
                { status: 409 }
            );
        }
        if (message.includes('CourseNotActive')) {
            return NextResponse.json(
                { error: 'Course is not active.' },
                { status: 400 }
            );
        }
        if (message.includes('LessonOutOfBounds')) {
            return NextResponse.json(
                { error: 'Lesson index is out of bounds.' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to complete lesson', details: safeErrorDetails(error) },
            { status: 500 }
        );
    }
}
