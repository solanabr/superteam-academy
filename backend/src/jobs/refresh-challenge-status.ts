import { getPrisma } from "@/lib/prisma.js";
import { computeChallengeStatus } from "@/academy/challenge-status.js";

export async function refreshChallengeStatus(): Promise<{
  pendingToActive: number;
  activeToEnded: number;
}> {
  const prisma = getPrisma();
  const now = new Date();

  const challenges = await prisma.challenge.findMany({
    include: { season: true },
  });

  let pendingToActive = 0;
  let activeToEnded = 0;

  for (const ch of challenges) {
    const nextStatus = computeChallengeStatus(ch, ch.season, now);
    if (nextStatus === ch.status) continue;

    if (ch.status === "pending" && nextStatus === "active") {
      pendingToActive += 1;
    } else if (ch.status === "active" && nextStatus === "ended") {
      activeToEnded += 1;
    }

    await prisma.challenge.update({
      where: { id: ch.id },
      data: { status: nextStatus },
    });
  }

  if (pendingToActive || activeToEnded) {
    console.log(
      `[refresh-challenge-status] updated statuses: pending→active=${pendingToActive}, active→ended=${activeToEnded}`
    );
  }

  return { pendingToActive, activeToEnded };
}

