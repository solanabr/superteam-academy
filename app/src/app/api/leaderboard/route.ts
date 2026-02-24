import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { connection } from "@/lib/solana/connection";
import { XP_MINT_ADDRESS } from "@/lib/constants";
import { calculateLevel } from "@/lib/constants";
import type { LeaderboardEntry } from "@/lib/services/types";

let cache: { data: LeaderboardEntry[]; ts: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET() {
  try {
    if (!XP_MINT_ADDRESS) {
      return NextResponse.json([]);
    }

    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const mint = new PublicKey(XP_MINT_ADDRESS);
    const largestAccounts = await connection.getTokenLargestAccounts(mint);

    const entries: LeaderboardEntry[] = [];

    for (const account of largestAccounts.value) {
      if (account.uiAmount === null || account.uiAmount === 0) continue;

      // Resolve the owner of this token account
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
    return NextResponse.json(entries);
  } catch (err: unknown) {
    console.error("Leaderboard error:", err);
    return NextResponse.json([]);
  }
}
