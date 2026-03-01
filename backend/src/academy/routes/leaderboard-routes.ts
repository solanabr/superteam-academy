import type { Hono } from "hono";
import { getPrisma } from "@/lib/prisma.js";

export function registerLeaderboardRoutes(app: Hono): void {
  app.get("/leaderboard", async (c) => {
    const prisma = getPrisma();
    const rows = await prisma.leaderboardEntry.findMany({
      orderBy: { totalXp: "desc" },
    });
    const entries = rows.map((r, i) => ({
      rank: i + 1,
      wallet: r.wallet,
      xp: r.totalXp,
      coursesCompleted: r.coursesCompleted,
    }));
    return c.json({ entries });
  });
}
