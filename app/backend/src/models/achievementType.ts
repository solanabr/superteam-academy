import mongoose, { Document, Schema } from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AchievementCategory =
    | "progress"
    | "streaks"
    | "skills"
    | "community"
    | "special";

// ─── Interface ────────────────────────────────────────────────────────────────

/**
 * AchievementType — mirrors an on-chain Program-Derived Account (PDA) that
 * defines and controls an achievement "mint authority".
 *
 * On-chain analogue:
 *   seeds: ["achievement_type", key]
 *   authority: admin keypair
 *   supply_cap: Option<u64>
 */
export interface IAchievementType extends Document {
    key: string;                  // snake_case slug — PDA seed, e.g. "first_steps"
    category: AchievementCategory;
    name: string;                 // Display name
    description: string;
    badgeImageUrl: string;        // URL of badge image (NFT image URI on-chain)
    xpReward: number;             // XP credited when receipt is minted
    supplyCap: number | null;     // null = unlimited; mirrors on-chain Option<u64>
    mintedCount: number;          // Incremented each time a receipt is created
    isActive: boolean;            // Soft-disable without deletion
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const AchievementTypeSchema = new Schema<IAchievementType>(
    {
        key: { type: String, required: true, unique: true, trim: true },
        category: {
            type: String,
            enum: ["progress", "streaks", "skills", "community", "special"],
            required: true,
        },
        name: { type: String, required: true },
        description: { type: String, required: true },
        badgeImageUrl: { type: String, default: "" },
        xpReward: { type: Number, required: true, default: 0 },
        supplyCap: { type: Number, default: null }, // null = unlimited
        mintedCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

AchievementTypeSchema.index({ key: 1 }, { unique: true });
AchievementTypeSchema.index({ category: 1 });

export const AchievementType = mongoose.model<IAchievementType>(
    "AchievementType",
    AchievementTypeSchema
);

// ─── Seed Data ────────────────────────────────────────────────────────────────

/**
 * All 15 achievement definitions. Call seedAchievementTypes() once on startup
 * (or in a migration) to ensure these exist in the DB.
 *
 * Uses upsert so it is safe to run multiple times.
 */
export const ACHIEVEMENT_DEFINITIONS: Omit<
    IAchievementType,
    keyof Document | "mintedCount" | "createdAt" | "updatedAt"
>[] = [
        // ── Progress ──────────────────────────────────────────────────────────────
        {
            key: "first_steps",
            category: "progress",
            name: "First Steps",
            description: "Complete your very first lesson.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326497/first_stepper_gjvmaq.png",
            xpReward: 25,
            supplyCap: null,
            isActive: true,
        },
        {
            key: "course_completer",
            category: "progress",
            name: "Course Completer",
            description: "Complete your first full course.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326498/course_completer_qprnqw.png",
            xpReward: 100,
            supplyCap: null,
            isActive: true,
        },
        {
            key: "speed_runner",
            category: "progress",
            name: "Speed Runner",
            description: "Complete a course within 24 hours of enrolling.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326499/speed_runner_gqiew9.png",
            xpReward: 150,
            supplyCap: null,
            isActive: true,
        },

        // ── Streaks ───────────────────────────────────────────────────────────────
        {
            key: "week_warrior",
            category: "streaks",
            name: "Week Warrior",
            description: "Maintain a 7-day learning streak.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326499/work_warrior_fpzx9p.png",
            xpReward: 50,
            supplyCap: null,
            isActive: true,
        },
        {
            key: "monthly_master",
            category: "streaks",
            name: "Monthly Master",
            description: "Maintain a 30-day learning streak.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326498/monthly_master_ctu05b.png",
            xpReward: 200,
            supplyCap: null,
            isActive: true,
        },
        {
            key: "consistency_king",
            category: "streaks",
            name: "Consistency King",
            description: "Maintain a 100-day learning streak.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326497/consistency_king_h5ef5o.png",
            xpReward: 500,
            supplyCap: null,
            isActive: true,
        },

        // ── Skills ────────────────────────────────────────────────────────────────
        {
            key: "rust_rookie",
            category: "skills",
            name: "Rust Rookie",
            description: "Complete any smart-contract or Solana course.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326498/rust_rookie_c6d6xs.png",
            xpReward: 75,
            supplyCap: null,
            isActive: true,
        },
        {
            key: "anchor_expert",
            category: "skills",
            name: "Anchor Expert",
            description: "Complete 3 smart-contract courses.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326497/anchor_expert_zf41ed.png",
            xpReward: 150,
            supplyCap: null,
            isActive: true,
        },
        {
            key: "full_stack_solana",
            category: "skills",
            name: "Full Stack Solana",
            description: "Complete courses in 3 or more different topics.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326498/fullstack_sol_opgf8y.png",
            xpReward: 300,
            supplyCap: null,
            isActive: true,
        },

        // ── Community (stub — awaiting comment system) ────────────────────────────
        {
            key: "helper",
            category: "community",
            name: "Helper",
            description: "Help another learner in the community.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772327549/helper_fjy1su.png",
            xpReward: 25,
            supplyCap: null,
            isActive: false, // disabled until comment system exists
        },
        {
            key: "first_comment",
            category: "community",
            name: "First Comment",
            description: "Leave your first comment on a lesson.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/c_thumb,w_200,g_face/v1772327546/first_commenter.png_w5zemd.png",
            xpReward: 10,
            supplyCap: null,
            isActive: false,
        },
        {
            key: "top_contributor",
            category: "community",
            name: "Top Contributor",
            description: "Be recognised as a top community contributor.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772327548/top_contributor_uzereo.png",
            xpReward: 200,
            supplyCap: null,
            isActive: false,
        },

        // ── Special ───────────────────────────────────────────────────────────────
        {
            key: "early_adopter",
            category: "special",
            name: "Early Adopter",
            description: "Joined the academy during its early access period.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326498/early_hunter_xvierr.png",
            xpReward: 500,
            supplyCap: null,
            isActive: true,
        },
        {
            key: "bug_hunter",
            category: "special",
            name: "Bug Hunter",
            description: "Found and reported a bug — manually awarded by admins.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326498/bug_hunter_fjmynj.png",
            xpReward: 250,
            supplyCap: null,
            isActive: true,
        },
        {
            key: "perfect_score",
            category: "special",
            name: "Perfect Score",
            description: "Score 100% on a test on your very first attempt.",
            badgeImageUrl: "https://res.cloudinary.com/dkvj3fbg9/image/upload/v1772326499/perfect_score_gw9boa.png",
            xpReward: 100,
            supplyCap: null,
            isActive: true,
        },
    ];

export const seedAchievementTypes = async (): Promise<void> => {
    const ops = ACHIEVEMENT_DEFINITIONS.map((def) => ({
        updateOne: {
            filter: { key: def.key },
            update: { $setOnInsert: def },
            upsert: true,
        },
    }));
    await AchievementType.bulkWrite(ops);
    console.log("✅ Achievement types seeded");
};
