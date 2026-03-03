/**
 * GET /api/leaderboard — All users ranked by combined on-chain + off-chain XP.
 *
 * Fetches ALL registered users from DB.
 * For users with wallets: reads on-chain XP balance.
 * Adds offchain_xp from profiles column.
 * Ranks by totalXp = onchainXp + offchainXp.
 * Includes users with 0 XP.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { prisma } from '@/backend/prisma';
import type { LeaderboardEntry } from '@/context/types/leaderboard';
import { calculateLevel } from '@/context/xp-calculations';
import { getXpBalances } from '@/context/solana/xp';
import { getRpcUrl } from '@/context/env';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const rawLimit = searchParams.get('limit') || '100';
        const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 100, 1), 500);

        // Fetch ALL registered users (including those without wallets or with 0 XP)
        const profiles = await prisma.profiles.findMany({
            where: { deleted_at: null },
            select: {
                id: true,
                username: true,
                wallet_address: true,
                name: true,
                avatar_url: true,
                offchain_xp: true,
            },
        });

        if (profiles.length === 0) {
            return NextResponse.json([]);
        }

        // Batch read on-chain XP for users who have wallets
        const walleted = profiles.filter((p) => p.wallet_address);
        let onchainMap = new Map<string, number>();

        if (walleted.length > 0) {
            try {
                const connection = new Connection(getRpcUrl(), 'confirmed');
                const owners = walleted.map((p) => new PublicKey(p.wallet_address!));
                onchainMap = await getXpBalances(connection, owners);
            } catch (rpcError) {
                console.warn('[Leaderboard] Failed to fetch on-chain balances, using 0:', rpcError);
            }
        }

        // Build leaderboard entries with dual-XP
        const entries: LeaderboardEntry[] = profiles.map((p) => {
            const onchainXp = p.wallet_address
                ? (onchainMap.get(p.wallet_address) ?? 0)
                : 0;
            const offchainXp = p.offchain_xp ?? 0;
            const totalXp = onchainXp + offchainXp;

            return {
                rank: 0, // Will be set after sorting
                userId: p.id,
                username: p.username ?? null,
                wallet: p.wallet_address ?? '',
                name: p.name,
                avatar: p.avatar_url,
                onchainXp,
                offchainXp,
                totalXp,
                level: calculateLevel(totalXp),
            };
        });

        // Sort by totalXp descending, then assign ranks
        entries.sort((a, b) => b.totalXp - a.totalXp);
        entries.forEach((e, i) => { e.rank = i + 1; });

        return NextResponse.json(entries.slice(0, limit));
    } catch (error) {
        console.error('[Leaderboard] Error fetching leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
