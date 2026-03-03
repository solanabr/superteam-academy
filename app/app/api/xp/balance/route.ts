/**
 * POST /api/xp/balance
 *
 * Returns XP balance, level, and progress for a wallet address.
 *
 * Request body: { wallet: string }
 * Response: { balance, level, nextLevelXp, levelProgress }
 */
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getRpcUrl } from '@/context/env';
import { getXpBalance } from '@/context/solana/xp';
import {
    calculateLevel,
    getNextLevelXp,
    getLevelProgress,
} from '@/context/xp-calculations';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet } = body;

        if (!wallet || typeof wallet !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid wallet address' },
                { status: 400 }
            );
        }

        let ownerPubkey: PublicKey;
        try {
            ownerPubkey = new PublicKey(wallet);
        } catch {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        const connection = new Connection(getRpcUrl(), 'confirmed');
        const balance = await getXpBalance(connection, ownerPubkey);

        return NextResponse.json({
            wallet,
            balance,
            level: calculateLevel(balance),
            nextLevelXp: getNextLevelXp(balance),
            levelProgress: getLevelProgress(balance),
        });
    } catch (error) {
        console.error('XP balance fetch failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch XP balance' },
            { status: 500 }
        );
    }
}
