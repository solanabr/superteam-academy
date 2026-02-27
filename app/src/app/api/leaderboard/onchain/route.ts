/**
 * On-Chain Leaderboard API
 * Uses the active indexer provider (Custom / Helius / Alchemy)
 * to fetch XP Token-2022 holder rankings.
 *
 * GET /api/leaderboard/onchain
 */
import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getActiveIndexer } from '@/lib/solana/indexer';

export interface OnChainLeaderboardEntry {
  rank: number;
  wallet: string;
  xpBalance: number;
  level: number;
  displayName?: string;
  avatar?: string;
}

export interface OnChainLeaderboardResponse {
  entries: OnChainLeaderboardEntry[];
  total: number;
  source: string; // 'custom' | 'helius' | 'alchemy'
  userContext?: {
    rank: number;
    xpBalance: number;
    level: number;
    totalParticipants: number;
  } | null;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<OnChainLeaderboardResponse | { error: string }>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const walletAddress = searchParams.get('wallet');

    // Get the active indexer (custom by default)
    const indexer = await getActiveIndexer();
    const leaderboard = await indexer.fetchLeaderboard(limit);

    // Transform to response format
    const entries: OnChainLeaderboardEntry[] = leaderboard.map((entry) => ({
      rank: entry.rank,
      wallet: entry.wallet.toBase58(),
      xpBalance: entry.xpBalance,
      level: entry.level,
    }));

    // Get user context if wallet provided
    let userContext = null;
    if (walletAddress) {
      try {
        const wallet = new PublicKey(walletAddress);
        userContext = await indexer.fetchWalletRank(wallet);
      } catch {
        // Invalid wallet address, ignore
      }
    }

    return NextResponse.json({
      entries,
      total: entries.length,
      source: indexer.provider,
      userContext,
    });
  } catch (error) {
    console.error('Error fetching on-chain leaderboard:', error);

    return NextResponse.json({ error: 'Failed to fetch on-chain leaderboard' }, { status: 500 });
  }
}
