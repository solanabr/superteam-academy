import { NextResponse } from 'next/server';
import { HELIUS_RPC, XP_MINT } from '@/lib/solana/constants';

/**
 * GET /api/leaderboard
 *
 * Returns the top XP holders ranked by balance. Uses Helius DAS
 * getTokenAccounts to fetch all holders of the XP mint, sorted
 * by descending balance.
 *
 * Responses are cached in-memory for 60 seconds to reduce RPC load.
 */

interface LeaderboardEntry {
  wallet: string;
  xpBalance: number;
  rank: number;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  total: number;
}

interface CachedLeaderboard {
  data: LeaderboardData;
  timestamp: number;
}

let cachedLeaderboard: CachedLeaderboard | null = null;
const CACHE_TTL = 60_000; // 60 seconds

export async function GET() {
  if (cachedLeaderboard && Date.now() - cachedLeaderboard.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedLeaderboard.data);
  }

  try {
    const response = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getTokenAccounts',
        params: {
          mint: XP_MINT.toBase58(),
          limit: 100,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius RPC responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `Helius RPC error: ${data.error.message || JSON.stringify(data.error)}`,
      );
    }

    const accounts: Array<{ owner: string; amount: string }> =
      data.result?.token_accounts || [];

    const entries: LeaderboardEntry[] = accounts
      .map((acc) => ({
        wallet: acc.owner,
        xpBalance: Number(acc.amount),
        rank: 0, // placeholder, assigned after sort
      }))
      .sort((a, b) => b.xpBalance - a.xpBalance)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const result: LeaderboardData = { entries, total: entries.length };
    cachedLeaderboard = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Leaderboard fetch failed:', err);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 },
    );
  }
}
