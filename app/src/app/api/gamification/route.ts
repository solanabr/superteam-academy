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
    const [history, titleMap] = await Promise.all([
      gamificationService.getXPHistory(session.user.id, limit),
      import("@/lib/courses").then(({ getCourseTitleMap }) => getCourseTitleMap()),
    ]);

    // Resolve course_pda → course name by building a PDA → courseId reverse map
    const { getCoursePDA } = await import("@/lib/solana/enrollments");
    const pdaToTitle = new Map<string, string>();
    for (const [courseId, title] of Object.entries(titleMap)) {
      try {
        const pda = getCoursePDA(courseId).toBase58();
        pdaToTitle.set(pda, title);
      } catch { /* skip invalid courseIds */ }
    }

    const enriched = history.map((tx) => ({
      ...tx,
      courseName: tx.sourceId ? (pdaToTitle.get(tx.sourceId) ?? titleMap[tx.sourceId]) : undefined,
    }));

    return NextResponse.json(enriched);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
