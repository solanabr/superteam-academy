import "dotenv/config";
import { getBackendProgram } from "@/program.js";
import { fetchConfig, getAllXpHolders } from "@/academy/shared.js";
import { getPrisma } from "@/lib/prisma.js";

async function main(): Promise<void> {
  const program = getBackendProgram();
  if (!program) {
    console.error("ACADEMY_BACKEND_SIGNER_KEYPAIR not set");
    process.exit(1);
  }
  const { config } = await fetchConfig(program);
  const holders = await getAllXpHolders(program, config.xpMint);
  const prisma = getPrisma();
  const entries: { wallet: string; totalXp: number; coursesCompleted: number }[] = [];
  for (const { wallet, balance } of holders) {
    const completed = await prisma.enrollment.count({
      where: { wallet, completedAt: { not: null } },
    });
    entries.push({ wallet, totalXp: balance, coursesCompleted: completed });
  }
  entries.sort((a, b) => b.totalXp - a.totalXp);
  await prisma.leaderboardEntry.deleteMany({});
  await prisma.leaderboardEntry.createMany({
    data: entries.map((e) => ({
      wallet: e.wallet,
      totalXp: e.totalXp,
      coursesCompleted: e.coursesCompleted,
    })),
  });
  console.log(`Synced ${entries.length} leaderboard entries`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
