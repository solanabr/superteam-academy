import { NextRequest, NextResponse } from "next/server";
import { ensureUser } from "@/lib/db/helpers";

export async function POST(req: NextRequest) {
  const { userId, challengeId } = await req.json();
  if (!userId || !challengeId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const user = await ensureUser(userId);
  const idx = user.completedPractice.indexOf(challengeId);
  if (idx === -1) {
    return NextResponse.json({ error: "challenge not in completed list" }, { status: 404 });
  }

  // Find the challenge XP to deduct
  const { PRACTICE_CHALLENGES } = await import("@/lib/data/practice-challenges");
  const challenge = PRACTICE_CHALLENGES.find((c) => c.id === challengeId);
  const xpToDeduct = challenge?.xpReward ?? 0;

  user.completedPractice.splice(idx, 1);
  user.practiceTxHashes.delete(challengeId);
  user.xp = Math.max(0, user.xp - xpToDeduct);
  await user.save();

  return NextResponse.json({ ok: true, removed: challengeId, xpDeducted: xpToDeduct });
}
