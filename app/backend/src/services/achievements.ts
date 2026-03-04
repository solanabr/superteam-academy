import mongoose from "mongoose";
import { AchievementType } from "../models/achievementType";
import { AchievementReceipt } from "../models/achievementReceipt";
import { User } from "../models/users";
import { Enrollment } from "../models/enrollment";
import { MilestoneProgress } from "../models/milestoneProgress";
import { getLevel } from "./gamification";

// ─── Core Award Function ──────────────────────────────────────────────────────

interface AwardResult {
    alreadyHad: boolean;
    receipt: typeof AchievementReceipt.prototype | null;
    xpAwarded: number;
}

/**
 * awardAchievement
 *
 * Mints a soulbound AchievementReceipt to the user.
 * Mirrors on-chain behaviour:
 *   - Idempotent: returns { alreadyHad: true } if the user already holds the receipt.
 *   - Checks supply cap before minting.
 *   - Credits xpReward to user.totalXP and recalculates level.
 *   - Atomically increments AchievementType.mintedCount.
 */
export const awardAchievement = async (
    userId: string,
    key: string
): Promise<AwardResult> => {
    // 1. Fetch the achievement type
    const type = await AchievementType.findOne({ key, isActive: true });
    if (!type) return { alreadyHad: false, receipt: null, xpAwarded: 0 };

    // 2. Idempotency check — mirrors PDA uniqueness
    const existing = await AchievementReceipt.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        achievementTypeKey: key,
    });
    if (existing) return { alreadyHad: true, receipt: existing, xpAwarded: 0 };

    // 3. Supply cap check
    if (type.supplyCap !== null && type.mintedCount >= type.supplyCap) {
        return { alreadyHad: false, receipt: null, xpAwarded: 0 };
    }

    // 4. Mint the receipt
    const receipt = await AchievementReceipt.create({
        userId: new mongoose.Types.ObjectId(userId),
        achievementTypeKey: key,
        mintStub: {
            name: type.name,
            uri: type.badgeImageUrl,
            minted: true,
            mintedAt: new Date(),
        },
        xpAwarded: type.xpReward,
        awardedAt: new Date(),
    });

    // 5. Increment mintedCount atomically
    await AchievementType.findByIdAndUpdate(type._id, {
        $inc: { mintedCount: 1 },
    });

    // 6. Credit XP to user
    const user = await User.findById(userId);
    if (user && type.xpReward > 0) {
        user.totalXP += type.xpReward;
        user.level = getLevel(user.totalXP);
        await user.save();
    }

    return { alreadyHad: false, receipt, xpAwarded: type.xpReward };
};

// ─── Criteria Checkers ────────────────────────────────────────────────────────

/**
 * checkProgressAchievements
 * Called after lesson completion or course completion.
 */
export const checkProgressAchievements = async (
    userId: string
): Promise<void> => {
    try {
        // first_steps — any lesson ever completed
        const hasAnyLesson = await MilestoneProgress.exists({
            userId,
            completedLessons: { $not: { $size: 0 } },
        });
        if (hasAnyLesson) {
            await awardAchievement(userId, "first_steps");
        }

        // course_completer — at least one enrollment completed
        const hasCompletedCourse = await Enrollment.exists({
            userId,
            completedAt: { $exists: true, $ne: null },
        });
        if (hasCompletedCourse) {
            await awardAchievement(userId, "course_completer");
        }

        // speed_runner — any course completed within 24h of enrollment
        const enrollments = await Enrollment.find({
            userId,
            completedAt: { $exists: true, $ne: null },
        }).lean();

        const isSpeedRunner = enrollments.some((e) => {
            if (!e.completedAt || !e.createdAt) return false;
            const diffMs = new Date(e.completedAt).getTime() - new Date(e.createdAt).getTime();
            return diffMs <= 24 * 60 * 60 * 1000; // 24 hours
        });

        if (isSpeedRunner) {
            await awardAchievement(userId, "speed_runner");
        }
    } catch (err) {
        console.error("[checkProgressAchievements] error:", err);
    }
};

/**
 * checkStreakAchievements
 * Called after updateStreak. Checks current streak value.
 */
export const checkStreakAchievements = async (
    userId: string,
    currentStreak: number
): Promise<void> => {
    try {
        if (currentStreak >= 7) await awardAchievement(userId, "week_warrior");
        if (currentStreak >= 30) await awardAchievement(userId, "monthly_master");
        if (currentStreak >= 100) await awardAchievement(userId, "consistency_king");
    } catch (err) {
        console.error("[checkStreakAchievements] error:", err);
    }
};

/**
 * checkSkillAchievements
 * Called after course completion.
 * @param completedTopics - array of topic strings from all user's completed enrollments
 */
export const checkSkillAchievements = async (
    userId: string,
    completedTopics: string[]
): Promise<void> => {
    try {
        const smartContractTopics = ["smart-contracts", "solana-basics"];

        const hasSmartContract = completedTopics.some((t) =>
            smartContractTopics.includes(t)
        );
        if (hasSmartContract) {
            await awardAchievement(userId, "rust_rookie");
        }

        const smartContractCount = completedTopics.filter((t) =>
            smartContractTopics.includes(t)
        ).length;
        if (smartContractCount >= 3) {
            await awardAchievement(userId, "anchor_expert");
        }

        const uniqueTopics = new Set(completedTopics);
        if (uniqueTopics.size >= 3) {
            await awardAchievement(userId, "full_stack_solana");
        }
    } catch (err) {
        console.error("[checkSkillAchievements] error:", err);
    }
};

/**
 * checkPerfectScore
 * Called after a test attempt where score === 100 on the first attempt.
 */
export const checkPerfectScore = async (userId: string): Promise<void> => {
    try {
        await awardAchievement(userId, "perfect_score");
    } catch (err) {
        console.error("[checkPerfectScore] error:", err);
    }
};

/**
 * checkEarlyAdopter
 * Called on first login/registration.
 * Early adopter cutoff: 2026-06-01 UTC.
 */
export const checkEarlyAdopter = async (userId: string): Promise<void> => {
    try {
        const CUTOFF = new Date("2026-06-01T00:00:00Z");
        const user = await User.findById(userId).select("createdAt").lean();
        if (user && new Date(user.createdAt) < CUTOFF) {
            await awardAchievement(userId, "early_adopter");
        }
    } catch (err) {
        console.error("[checkEarlyAdopter] error:", err);
    }
};
