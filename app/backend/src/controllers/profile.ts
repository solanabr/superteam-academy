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

                    role: user.role,

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

/**
 * PUT /api/v1/profile/me
 * Updates the authenticated user's profile.
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const {
            username,
            name,
            bio,
            avatar,
            twitter,
            github,
            discord,
            website,
            language,
            theme,
            isPublic
        } = req.body;

        // ── 1. Find user ────────────────────────────────────────────────────────
        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        // ── 2. Update allowed fields ─────────────────────────────────────────────
        if (username !== undefined) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                res.status(400).json({ success: false, message: "Username already exists" });
                return;
            }
            user.username = username
        };
        if (name !== undefined) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (avatar !== undefined) user.avatar = avatar;

        // Social links
        if (twitter !== undefined) user.twitter = twitter;
        if (github !== undefined) user.github = github;
        if (discord !== undefined) user.discord = discord;
        if (website !== undefined) user.website = website;

        // Preferences
        if (language !== undefined) user.language = language;
        if (theme !== undefined) user.theme = theme;
        if (isPublic !== undefined) user.isPublic = isPublic;

        // ── 3. Save changes ──────────────────────────────────────────────────────
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                profile: {
                    id: user._id,
                    username: user.username,
                    name: user.name,
                    bio: user.bio,
                    avatar: user.avatar,
                    twitter: user.twitter,
                    github: user.github,
                    discord: user.discord,
                    website: user.website,
                    language: user.language,
                    theme: user.theme,
                    isPublic: user.isPublic,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (err: any) {
        console.error("[updateProfile] error:", err);

        // Handle duplicate username/email errors from Mongoose
        if (err.code === 11000) {
            res.status(400).json({
                success: false,
                message: "Username already exists"
            });
            return;
        }

        res.status(500).json({ success: false, message: "Server error" });
    }
};


