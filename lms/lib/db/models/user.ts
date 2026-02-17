import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  wallet: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  xp: number;
  streak: {
    current: number;
    longest: number;
    lastDay: number;
  };
  claimedAchievements: number[];
  completedPractice: string[];
  practiceTxHashes: Map<string, string>;
  claimedMilestones: number[];
  milestoneTxHashes: Map<string, string>;
  communityPoints: number;
  endorsementCount: number;
  joinedAt: Date;
}

const UserSchema = new Schema<IUser>({
  wallet: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, default: undefined },
  bio: { type: String, default: undefined },
  avatar: { type: String, default: undefined },
  xp: { type: Number, default: 0 },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastDay: { type: Number, default: 0 },
  },
  claimedAchievements: { type: [Number], default: [] },
  completedPractice: { type: [String], default: [] },
  practiceTxHashes: { type: Map, of: String, default: new Map() },
  claimedMilestones: { type: [Number], default: [] },
  milestoneTxHashes: { type: Map, of: String, default: new Map() },
  communityPoints: { type: Number, default: 0 },
  endorsementCount: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
});

// Delete cached model so schema changes (e.g. new fields) are picked up during HMR
delete mongoose.models.User;
export const User = mongoose.model<IUser>("User", UserSchema);
