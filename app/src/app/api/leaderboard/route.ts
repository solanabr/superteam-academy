import { NextResponse } from "next/server";
import { PrismaProgressService } from "@/lib/services/prisma-progress";
import { getXpLeaderboard, getConnection } from "@/lib/onchain";

const service = new PrismaProgressService();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = (searchParams.get("timeframe") ?? "alltime") as
    | "weekly"
    | "monthly"
    | "alltime";
  const courseId = searchParams.get("courseId") ?? undefined;

  const [dbEntries, chainEntries] = await Promise.all([
    service.getLeaderboard(timeframe, courseId),
    getXpLeaderboard(getConnection()).catch(() => []),
  ]);

  if (chainEntries.length === 0) {
    return NextResponse.json(dbEntries);
  }

  // Build a lookup from DB entries by wallet address
  const dbByWallet = new Map(dbEntries.map((e) => [e.wallet, e]));

  const merged = chainEntries.map((c, i) => {
    const db = dbByWallet.get(c.owner);
    return {
      rank: i + 1,
      wallet: c.owner,
      displayName: db?.displayName ?? c.owner.slice(0, 8) + "\u2026",
      avatar: db?.avatar,
      xp: c.balance,
      level: Math.floor(Math.sqrt(c.balance / 100)),
      streak: db?.streak ?? 0,
      onChain: true,
    };
  });

  return NextResponse.json(merged);
}
