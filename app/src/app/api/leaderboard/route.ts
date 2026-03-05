import { NextResponse } from "next/server";
import { getLeaderboard } from "@/data/leaderboard";
import { fetchHeliusLeaderboard } from "@/services/onchain/leaderboard.service";
import type { LeaderboardEntry, TimeFilter } from "@/types";

/**
 * GET /api/leaderboard?timeframe=weekly&page=1&pageSize=10
 *
 * When HELIUS_RPC_URL is configured → fetches XP token holders
 * from Helius DAS and sorts by balance. Otherwise → mock data.
 *
 * Cached with 5-min TTL.
 */

let cache: {
  data: LeaderboardEntry[];
  timestamp: number;
} | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const HELIUS_URL = process.env.HELIUS_RPC_URL;
const XP_MINT = process.env.NEXT_PUBLIC_XP_MINT;

async function fetchEntries(
  timeframe: TimeFilter,
): Promise<LeaderboardEntry[]> {
  // Try on-chain via Helius DAS
  if (HELIUS_URL && XP_MINT) {
    try {
      const entries = await fetchHeliusLeaderboard(HELIUS_URL, XP_MINT);
      if (entries.length > 0) return entries;
    } catch {
      // Fall through to mock data
    }
  }

  // Fallback to mock data
  return getLeaderboard(timeframe);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = (searchParams.get("timeframe") || "all-time") as TimeFilter;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  // Use cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    const entries = cache.data;
    const total = entries.length;
    const start = (page - 1) * pageSize;
    return NextResponse.json({
      entries: entries.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    });
  }

  // Fetch fresh data
  const entries = await fetchEntries(timeframe);
  cache = { data: entries, timestamp: Date.now() };

  const total = entries.length;
  const start = (page - 1) * pageSize;

  return NextResponse.json({
    entries: entries.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  });
}
