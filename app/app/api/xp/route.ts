/**
 * GET /api/xp — Returns the current user's combined XP (on-chain + off-chain).
 *
 * Lightweight endpoint for the header XP badge.
 * Only fetches the current user's data (1 DB query + 1 optional RPC call).
 */
import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';
import { getXpBalance } from '@/context/solana/xp';
import { getRpcUrl } from '@/context/env';

export async function GET(): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await prisma.profiles.findUnique({
            where: { id: session.user.id },
            select: { wallet_address: true, offchain_xp: true },
        });

        const offchainXp = profile?.offchain_xp ?? 0;
        let onchainXp = 0;

        if (profile?.wallet_address) {
            try {
                const connection = new Connection(getRpcUrl(), 'confirmed');
                onchainXp = await getXpBalance(connection, new PublicKey(profile.wallet_address));
            } catch {
                // RPC failure — use 0 for on-chain, still show off-chain
            }
        }

        return NextResponse.json({
            onchainXp,
            offchainXp,
            totalXp: onchainXp + offchainXp,
        });
    } catch (error) {
        console.error('[XP] Error fetching user XP:', error);
        return NextResponse.json({ error: 'Failed to fetch XP' }, { status: 500 });
    }
}
