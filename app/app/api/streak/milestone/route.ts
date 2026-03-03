/**
 * POST /api/streak/milestone
 *
 * Claims a streak milestone reward by minting XP on-chain via reward_xp.
 *
 * Body: { days: number, learnerWallet: string }
 * - days: The milestone day count (7, 30, 100, etc.)
 * - learnerWallet: The user's connected Solana wallet address
 *
 * Flow:
 * 1. Validate milestone exists and streak is sufficient
 * 2. Check double-claim via DB unique constraint
 * 3. Verify wallet ownership via linked_accounts
 * 4. Ensure recipient XP ATA exists
 * 5. Call reward_xp on-chain (backend-signed)
 * 6. Store tx signature in DB
 */
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';
import { STREAK_MILESTONES } from '@/context/types/streak';
import { TransactionBuilder } from '@/context/solana/tx-builder';
import { loadBackendSigner } from '@/context/solana/backend-signer';
import { PROGRAM_ID, XP_MINT } from '@/context/solana/constants';
import { ensureXpAta } from '@/context/solana/xp';
import { getRpcUrl, safeErrorDetails } from '@/context/env';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const days = Number(body.days);
        const { learnerWallet } = body;

        // Validate milestone exists
        const milestone = STREAK_MILESTONES.find((m) => m.days === days);
        if (!milestone) {
            return NextResponse.json(
                { error: `Invalid milestone: ${days} days` },
                { status: 400 }
            );
        }

        // Validate wallet
        if (!learnerWallet || typeof learnerWallet !== 'string') {
            return NextResponse.json(
                { error: 'learnerWallet is required. Connect your wallet to claim XP.' },
                { status: 400 }
            );
        }

        let learner: PublicKey;
        try {
            learner = new PublicKey(learnerWallet);
        } catch {
            return NextResponse.json(
                { error: 'Invalid wallet address.' },
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

        // Verify streak is sufficient
        const streakRow = await prisma.streaks.findFirst({
            where: { user_id: session.user.id },
            select: { current_streak: true },
        });

        if (!streakRow || streakRow.current_streak < days) {
            return NextResponse.json(
                { error: `Streak of ${days} days not yet reached` },
                { status: 400 }
            );
        }

        // Insert milestone claim (unique constraint prevents double-claim)
        try {
            await prisma.streak_milestones.create({
                data: {
                    user_id: session.user.id,
                    milestone_days: days,
                    xp_reward: milestone.xpReward,
                },
            });
        } catch (error: unknown) {
            const prismaError = error as { code?: string };
            if (prismaError?.code === 'P2002') {
                return NextResponse.json(
                    { error: 'Milestone already claimed' },
                    { status: 409 }
                );
            }
            throw error;
        }

        // Mint XP on-chain via reward_xp
        const connection = new Connection(getRpcUrl(), 'confirmed');
        const backendSigner = loadBackendSigner();

        await ensureXpAta(connection, learner, backendSigner);

        const txBuilder = new TransactionBuilder({
            connection,
            backendSigner,
            programId: PROGRAM_ID,
            xpMint: XP_MINT,
        });

        const memo = `streak-milestone:${days}d`;
        const result = await txBuilder.rewardXp(learner, milestone.xpReward, memo);

        // Update DB record with tx signature
        await prisma.streak_milestones.updateMany({
            where: {
                user_id: session.user.id,
                milestone_days: days,
            },
            data: {
                tx_signature: result.signature,
            },
        });

        return NextResponse.json({
            success: true,
            signature: result.signature,
            milestone: {
                days,
                xpReward: milestone.xpReward,
                achievement: milestone.achievement,
            },
        });
    } catch (error) {
        console.error('Milestone claim failed:', error);
        return NextResponse.json(
            { error: 'Failed to claim milestone', details: safeErrorDetails(error) },
            { status: 500 }
        );
    }
}
