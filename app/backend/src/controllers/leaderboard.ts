import { Request, Response } from "express";
import { User } from "../models/users";
import { getXPProgress } from "../services/gamification";

/**
 * GET /api/v1/leaderboard
 * Query params:
 *   period: "week" | "month" | "all" (default: "all")
 *   page: number (default: 1)
 *   limit: number (default: 20, max: 100)
 *
 * Returns global XP rankings + the current user's rank.
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { period = "all", page = "1", limit = "20" } = req.query;
        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        // ── 1. Build filter ───────────────────────────────────────────────────────
        const filter: Record<string, any> = {};

        if (period === "week") {
            const since = new Date();
            since.setDate(since.getDate() - 7);
            filter.lastActive = { $gte: since };
        } else if (period === "month") {
            const since = new Date();
            since.setMonth(since.getMonth() - 1);
            filter.lastActive = { $gte: since };
        }
        // "all" → no filter

        // ── 2. Fetch ranked users ─────────────────────────────────────────────────
        const [users, total] = await Promise.all([
            User.find(filter)
                .select("username name avatar totalXP level currentStreak lastActive")
                .sort({ totalXP: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            User.countDocuments(filter),
        ]);

        const rankings = users.map((u, i) => {
            const xpData = getXPProgress(u.totalXP);
            return {
                rank: skip + i + 1,
                userId: u._id,
                username: u.username ?? null,
                name: u.name ?? null,
                avatar: u.avatar ?? null,
                totalXP: u.totalXP,
                level: xpData.level,
                progressPercent: xpData.progressPercent,
                currentStreak: u.currentStreak,
                lastActive: u.lastActive ?? null,
            };
        });

        // ── 3. Current user's rank (optional auth) ────────────────────────────────
        let currentUser = null;
        const authUserId = (req as any).user?.id;

        if (authUserId) {
            // Count how many users have more XP than this user (within the same filter)
            const currentUserDoc = await User.findById(authUserId)
                .select("username name avatar totalXP level currentStreak lastActive")
                .lean();

            if (currentUserDoc) {
                const rankFilter = { ...filter, totalXP: { $gt: currentUserDoc.totalXP } };
                const rank = (await User.countDocuments(rankFilter)) + 1;
                const xpData = getXPProgress(currentUserDoc.totalXP);

                currentUser = {
                    rank,
                    userId: currentUserDoc._id,
                    username: currentUserDoc.username ?? null,
                    name: currentUserDoc.name ?? null,
                    avatar: currentUserDoc.avatar ?? null,
                    totalXP: currentUserDoc.totalXP,
                    level: xpData.level,
                    progressPercent: xpData.progressPercent,
                    currentStreak: currentUserDoc.currentStreak,
                    lastActive: currentUserDoc.lastActive ?? null,
                };
            }
        }

        // ── 4. Response ───────────────────────────────────────────────────────────
        res.status(200).json({
            success: true,
            data: {
                period,
                rankings,
                currentUser,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (err: any) {
        console.error("[getLeaderboard] error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
