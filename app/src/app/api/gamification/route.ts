import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gamificationService } from "@/services/gamification";
import { PublicKey } from "@solana/web3.js";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "stats";

  if (type === "stats") {
    const walletAddress = session.walletAddress;

    // XP is on-chain (Token-2022 ATA); streak is off-chain (Supabase)
    const [xp, streak] = await Promise.all([
      walletAddress
        ? import("@/lib/solana/on-chain").then(({ getXPBalance }) =>
            getXPBalance(new PublicKey(walletAddress)).catch(() => 0),
        )
        : Promise.resolve(0),
      gamificationService.getStreak(session.user.id),
    ]);

    // Level derived from XP: floor(sqrt(xp / 100))
    const level = Math.floor(Math.sqrt(xp / 100));

    return NextResponse.json({ xp, level, streak });
  }

  if (type === "achievements") {
    const achievements = await gamificationService.getAchievements(
      session.user.id,
    );
    return NextResponse.json(achievements);
  }

  if (type === "history") {
    const limit = parseInt(
      req.nextUrl.searchParams.get("limit") ?? "20",
      10,
    );
    const history = await gamificationService.getXPHistory(
      session.user.id,
      limit,
    );
    return NextResponse.json(history);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
