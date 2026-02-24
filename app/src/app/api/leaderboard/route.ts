import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { connection } from "@/lib/solana/connection";
import { XP_MINT_ADDRESS } from "@/lib/constants";
import { calculateLevel } from "@/lib/constants";
import type { LeaderboardEntry } from "@/lib/services/types";

let cache: { data: LeaderboardEntry[]; ts: number } | null = null;
const CACHE_TTL = 60_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT)),
    );

    if (!XP_MINT_ADDRESS) {
      return NextResponse.json({ entries: [], page, limit, total: 0 });
    }

    if (!cache || Date.now() - cache.ts >= CACHE_TTL) {
      const mint = new PublicKey(XP_MINT_ADDRESS);
      const largestAccounts = await connection.getTokenLargestAccounts(mint);

      const entries: LeaderboardEntry[] = [];

      for (const account of largestAccounts.value) {
        if (account.uiAmount === null || account.uiAmount === 0) continue;

        const accountInfo = await connection.getParsedAccountInfo(
          account.address,
        );
        const data = accountInfo.value?.data;
        const parsed = (typeof data === "object" && data !== null && "parsed" in data)
          ? (data as { parsed: { info?: { owner?: string } } }).parsed
          : undefined;
        const owner = parsed?.info?.owner;
        if (!owner) continue;

        const xp = account.uiAmount;
        entries.push({
          rank: 0,
          wallet: owner,
          xp,
          level: calculateLevel(xp),
          streak: 0,
        });
      }

      entries.sort((a, b) => b.xp - a.xp);
      entries.forEach((e, i) => (e.rank = i + 1));

      cache = { data: entries, ts: Date.now() };
    }

    // NOTE: weekly/monthly time filtering is not feasible with getTokenLargestAccounts
    // since it returns current balances without timestamps. The timeframe param is
    // accepted for API compatibility but returns all-time data. Accurate time-windowed
    // ranking would require an indexer tracking per-transaction XP deltas.

    const total = cache.data.length;
    const start = (page - 1) * limit;
    const slice = cache.data.slice(start, start + limit);

    return NextResponse.json({ entries: slice, page, limit, total });
  } catch (err: unknown) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ entries: [], page: 1, limit: DEFAULT_LIMIT, total: 0 });
  }
}
