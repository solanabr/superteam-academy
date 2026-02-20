import { Request, Response } from "express";
import { User } from "../models/users";
import { MilestoneProgress } from "../models/milestoneProgress";

/**
 * GET /api/v1/profile/me
 * Returns the authenticated user's profile along with XP summary.
 *
 * XP breakdown:
 *   - totalXP     : XP already unlocked and credited to the user (stored on User model)
 *   - lockedXP    : XP earned by completing milestones but not yet unlocked
 *                   (requires the whole course to be finished before it is released)
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;

        // ── 1. Fetch user ────────────────────────────────────────────────────────
        const user = await User.findById(userId).lean();

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        // ── 2. Calculate locked XP ───────────────────────────────────────────────
        // Locked XP = XP awarded for completed milestones where the full course
        // has NOT yet been completed (isXPUnlocked === false).
        // We only count milestones where all tests are passed (allTestsPassed: true)
        // so we reflect actual earned-but-locked XP, not just enrolled XP.
        const lockedMilestones = await MilestoneProgress.find({
            userId,
            allTestsPassed: true,
            isXPUnlocked: false,
        })
            .select("xpReward")
            .lean();

        const lockedXP = lockedMilestones.reduce(
            (sum, mp) => sum + (mp.xpReward ?? 0),
            0
        );

        // ── 3. Build response ────────────────────────────────────────────────────
        res.status(200).json({
            success: true,
            data: {
                profile: {
                    id: user._id,
                    username: user.username ?? null,
                    email: user.email ?? null,
                    name: user.name ?? null,
                    bio: user.bio ?? null,
                    avatar: user.avatar ?? null,

                    // Social links
                    twitter: user.twitter ?? null,
                    github: user.github ?? null,
                    discord: user.discord ?? null,
                    website: user.website ?? null,

                    // Preferences
                    language: user.language,
                    theme: user.theme,
                    isPublic: user.isPublic,

                    // Gamification
                    level: user.level,
                    currentStreak: user.currentStreak,
                    longestStreak: user.longestStreak,
                    lastActive: user.lastActive ?? null,

                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                xp: {
                    /** XP unlocked and fully credited to the user */
                    total: user.totalXP,
                    /** XP earned from completed milestones — released when the course is finished */
                    locked: lockedXP,
                },
            },
        });
    } catch (err: any) {
        console.error("[getProfile] error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
