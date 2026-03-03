/**
 * GET /api/leaderboard/rank — Current user's rank with dual-XP breakdown.
 */
import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';
import type { UserRank } from '@/context/types/leaderboard';
import { getXpBalance, getXpBalances } from '@/context/solana/xp';
import { getRpcUrl } from '@/context/env';

export async function GET(): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user profile
        const userProfile = await prisma.profiles.findUnique({
            where: { id: session.user.id },
            select: { wallet_address: true, offchain_xp: true },
        });

        const connection = new Connection(getRpcUrl(), 'confirmed');
        const userOnchain = userProfile?.wallet_address
            ? await getXpBalance(connection, new PublicKey(userProfile.wallet_address))
            : 0;
        const userOffchain = userProfile?.offchain_xp ?? 0;
        const userTotal = userOnchain + userOffchain;

        // Get all users for ranking
        const allProfiles = await prisma.profiles.findMany({
            where: { deleted_at: null },
            select: { wallet_address: true, offchain_xp: true },
        });

        // Get on-chain balances for all walleted users
        const walleted = allProfiles.filter((p) => p.wallet_address);
        let onchainMap = new Map<string, number>();

        if (walleted.length > 0) {
            try {
                const owners = walleted.map((p) => new PublicKey(p.wallet_address!));
                onchainMap = await getXpBalances(connection, owners);
            } catch {
                // RPC failure, use 0
            }
        }

        // Count how many users have more total XP
        let rank = 1;
        for (const p of allProfiles) {
            const onchain = p.wallet_address
                ? (onchainMap.get(p.wallet_address) ?? 0)
                : 0;
            const total = onchain + (p.offchain_xp ?? 0);
            if (total > userTotal) rank++;
        }

        const result: UserRank = {
            rank,
            onchainXp: userOnchain,
            offchainXp: userOffchain,
            totalXp: userTotal,
            totalUsers: allProfiles.length,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Leaderboard] Error fetching user rank:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user rank' },
            { status: 500 }
        );
    }
}
