/**
 * GET /api/cron/sync-xp-snapshots — Daily cron job to snapshot on-chain XP balances.
 *
 * Reads current on-chain XP for all wallets and stores in xp_snapshots table.
 * Used by weekly/monthly leaderboard filters.
 *
 * Protected by CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { prisma } from '@/backend/prisma';
import { getXpBalances } from '@/context/solana/xp';
import { getRpcUrl } from '@/context/env';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all wallets
        const profiles = await prisma.profiles.findMany({
            where: { wallet_address: { not: null }, deleted_at: null },
            select: { wallet_address: true },
        });

        if (profiles.length === 0) {
            return NextResponse.json({ synced: 0 });
        }

        const connection = new Connection(getRpcUrl(), 'confirmed');
        const owners = profiles
            .filter((p) => p.wallet_address)
            .map((p) => new PublicKey(p.wallet_address!));

        // Batch read on-chain XP
        const balances = await getXpBalances(connection, owners);
        const now = new Date();

        // Upsert snapshots
        let synced = 0;
        for (const [wallet, xp] of balances) {
            if (xp <= 0) continue;

            await prisma.xp_snapshots.upsert({
                where: {
                    wallet_snapped_at: {
                        wallet,
                        snapped_at: now,
                    },
                },
                update: {
                    xp_balance: BigInt(xp),
                },
                create: {
                    wallet,
                    xp_balance: BigInt(xp),
                    snapped_at: now,
                },
            });
            synced++;
        }

        console.log(`[Cron] Synced ${synced} XP snapshots`);
        return NextResponse.json({ synced, timestamp: now.toISOString() });
    } catch (error) {
        console.error('[Cron] Error syncing XP snapshots:', error);
        return NextResponse.json(
            { error: 'Failed to sync XP snapshots' },
            { status: 500 }
        );
    }
}
