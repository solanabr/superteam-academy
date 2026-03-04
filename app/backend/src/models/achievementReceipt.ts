import mongoose, { Document, Schema } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

/**
 * AchievementReceipt — mirrors a soulbound Metaplex Core NFT minted to the
 * recipient's wallet, derived from:
 *
 *   seeds: ["achievement_receipt", userId, achievementTypeKey]
 *
 * Soulbound: once created it cannot be transferred (enforced by unique index
 * on { userId, achievementTypeKey }).
 */
export interface IAchievementReceipt extends Document {
    userId: mongoose.Types.ObjectId;
    achievementTypeKey: string;     // References AchievementType.key

    /** Stub fields that would become on-chain NFT metadata on migration. */
    mintStub: {
        name: string;                 // e.g. "First Steps"
        uri: string;                  // Badge image URL → will be NFT metadata URI
        minted: boolean;              // Always true once this document exists
        mintedAt: Date;
    };

    xpAwarded: number;              // Copied from AchievementType.xpReward at mint time
    awardedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const MintStubSchema = new Schema(
    {
        name: { type: String, required: true },
        uri: { type: String, default: "" },
        minted: { type: Boolean, default: true },
        mintedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const AchievementReceiptSchema = new Schema<IAchievementReceipt>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        achievementTypeKey: { type: String, required: true },
        mintStub: { type: MintStubSchema, required: true },
        xpAwarded: { type: Number, required: true, default: 0 },
        awardedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

/**
 * Compound unique index — mirrors PDA uniqueness.
 * A user can only ever hold ONE receipt per achievement type (soulbound).
 */
AchievementReceiptSchema.index(
    { userId: 1, achievementTypeKey: 1 },
    { unique: true }
);

// Index for querying a user's full collection
AchievementReceiptSchema.index({ userId: 1, awardedAt: -1 });

export const AchievementReceipt = mongoose.model<IAchievementReceipt>(
    "AchievementReceipt",
    AchievementReceiptSchema
);
