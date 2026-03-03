'use client';

/**
 * React hook for fetching XP balance and level info.
 *
 * Queries the on-chain Token-2022 ATA to get the current
 * XP balance, then calculates the corresponding level.
 */
import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getXpBalance } from '@/context/solana/xp';
import {
    calculateLevel,
    getNextLevelXp,
    getLevelProgress,
} from '@/context/xp-calculations';

export interface XpData {
    balance: number;
    level: number;
    nextLevelXp: number;
    levelProgress: number;
}

/**
 * Fetch XP balance for a wallet and calculate level info.
 *
 * @param wallet - The wallet public key, or null if not connected
 * @returns Query result with XP balance, level, and progress
 */
export function useXpBalance(wallet: PublicKey | null) {
    const { connection } = useConnection();

    return useQuery<XpData>({
        queryKey: ['xpBalance', wallet?.toBase58()],
        queryFn: async (): Promise<XpData> => {
            if (!wallet) {
                return { balance: 0, level: 1, nextLevelXp: 1000, levelProgress: 0 };
            }

            const balance = await getXpBalance(connection, wallet);

            return {
                balance,
                level: calculateLevel(balance),
                nextLevelXp: getNextLevelXp(balance),
                levelProgress: getLevelProgress(balance),
            };
        },
        enabled: !!wallet,
        staleTime: 30_000,       // 30 seconds — XP changes only after tx
        refetchInterval: 60_000, // Refresh every minute
    });
}
