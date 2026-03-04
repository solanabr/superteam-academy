import { Request, Response } from "express";
import { AchievementType } from "../models/achievementType";
import { AchievementReceipt } from "../models/achievementReceipt";
import { awardAchievement } from "../services/achievements";

// ─── GET /achievements/types ──────────────────────────────────────────────────

/**
 * GET /api/v1/achievements/types
 * Returns all active AchievementType definitions.
 * Public — no auth required (like reading on-chain accounts).
 */
export const getAchievementTypes = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const types = await AchievementType.find({ isActive: true })
            .sort({ category: 1, name: 1 })
            .lean();

        res.status(200).json({
            success: true,
            data: types,
        });
    } catch (err) {
        console.error("[getAchievementTypes] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET /achievements/me ─────────────────────────────────────────────────────

/**
 * GET /api/v1/achievements/me
 * Returns all AchievementReceipts earned by the authenticated user,
 * each joined with its AchievementType metadata.
 * Mirrors querying all PDA receipts for a given wallet.
 */
export const getMyAchievements = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const receipts = await AchievementReceipt.find({ userId })
            .sort({ awardedAt: -1 })
            .lean();

        // Join with achievement type metadata
        const typeKeys = receipts.map((r) => r.achievementTypeKey);
        const types = await AchievementType.find({ key: { $in: typeKeys } }).lean();
        const typeMap = new Map(types.map((t) => [t.key, t]));

        const enriched = receipts.map((r) => ({
            ...r,
            achievementType: typeMap.get(r.achievementTypeKey) ?? null,
        }));

        res.status(200).json({
            success: true,
            data: enriched,
            total: enriched.length,
        });
    } catch (err) {
        console.error("[getMyAchievements] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── Admin: Award Achievement Manually ───────────────────────────────────────

/**
 * POST /api/v1/achievements/admin/award
 * Body: { userId, key }
 * Allows admins to manually award achievements like "bug_hunter".
 */
export const adminAwardAchievement = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { userId, key } = req.body;

        if (!userId || !key) {
            res
                .status(400)
                .json({ success: false, message: "userId and key are required" });
            return;
        }

        const result = await awardAchievement(userId, key);

        if (result.alreadyHad) {
            res.status(200).json({
                success: true,
                message: "User already has this achievement",
                data: result.receipt,
            });
            return;
        }

        if (!result.receipt) {
            res.status(404).json({
                success: false,
                message: "Achievement type not found or supply cap reached",
            });
            return;
        }

        res.status(201).json({
            success: true,
            message: `Achievement "${key}" awarded successfully`,
            data: { receipt: result.receipt, xpAwarded: result.xpAwarded },
        });
    } catch (err) {
        console.error("[adminAwardAchievement] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
