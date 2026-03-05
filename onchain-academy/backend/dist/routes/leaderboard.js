import { z } from "zod";
import { prisma } from "../lib/prisma.js";
export async function leaderboardRoutes(app) {
    app.get("/leaderboard", async (request) => {
        const query = z
            .object({
            timeframe: z
                .enum(["weekly", "monthly", "all-time"])
                .default("all-time"),
            courseId: z.string().optional(),
        })
            .parse(request.query);
        const primaryWhere = typeof query.courseId === "string"
            ? { timeframe: query.timeframe, courseId: query.courseId }
            : { timeframe: query.timeframe };
        let entries = await prisma.leaderboardSnapshot.findMany({
            where: primaryWhere,
            orderBy: { xp: "desc" },
            take: 100,
        });
        if (entries.length === 0 && query.courseId) {
            entries = await prisma.leaderboardSnapshot.findMany({
                where: { timeframe: query.timeframe, courseId: null },
                orderBy: { xp: "desc" },
                take: 100,
            });
        }
        return entries.map((entry, index) => ({
            rank: index + 1,
            walletAddress: entry.walletAddress,
            displayName: entry.displayName,
            xp: entry.xp,
            level: entry.level,
            streak: entry.streak,
            timeframe: query.timeframe,
        }));
    });
}
