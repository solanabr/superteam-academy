import "dotenv/config";
import { getPrisma } from "@/lib/prisma.js";
import { Prisma } from "@/generated/prisma/index.js";

export async function syncLeaderboardFromUsers(): Promise<void> {
  const prisma = getPrisma();
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO leaderboard_entries (wallet, total_xp, courses_completed, updated_at)
    SELECT wallet, total_xp, courses_completed, NOW()
    FROM users
    ON CONFLICT (wallet) DO UPDATE SET
      total_xp = EXCLUDED.total_xp,
      courses_completed = EXCLUDED.courses_completed,
      updated_at = NOW()
  `);
  const count = await prisma.user.count();
  console.log(`Synced ${count} leaderboard entries from users`);
}

async function main(): Promise<void> {
  await syncLeaderboardFromUsers();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
