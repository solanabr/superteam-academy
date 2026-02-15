import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  wallet: string;
  displayName?: string;
  bio?: string;
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
  joinedAt: Date;
}

const UserSchema = new Schema<IUser>({
  wallet: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, default: undefined },
  bio: { type: String, default: undefined },
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
  joinedAt: { type: Date, default: Date.now },
});

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
