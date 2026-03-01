import { NextRequest, NextResponse } from "next/server";
import { fetchXpLeaderboard } from "@/lib/solana/on-chain-service";
import { levelFromXp } from "@/lib/solana/constants";

export async function GET(req: NextRequest) {
  try {
    const entries = await fetchXpLeaderboard();

    const leaderboard = entries.slice(0, 50).map((entry, index) => ({
      rank: index + 1,
      wallet: entry.wallet,
      xp: entry.balance,
      level: levelFromXp(entry.balance),
    }));

    return NextResponse.json({ leaderboard });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
