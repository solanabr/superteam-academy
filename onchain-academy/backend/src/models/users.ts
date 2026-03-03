import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username?: string;
  email?: string;
  name?: string;
  bio?: string;
  avatar?: string;

  // Social Links
  twitter?: string;
  github?: string;
  discord?: string;
  website?: string;

  // Preferences
  language: "en" | "pt-br" | "es";
  theme: "light" | "dark";
  isPublic: boolean;
  role: "user" | "admin";
  isBanned: boolean;

  // Gamification
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActive?: Date;
  activityDates: string[]; // "YYYY-MM-DD" strings for heatmap (last 365 days)
  claimedStreakMilestones: number[]; // [7, 30, 100] — prevents duplicate streak milestone XP

  wallets: {
    publicKey: string;
    isPrimary: boolean;
    linkedAt: Date;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    bio: { type: String },
    avatar: { type: String },

    // Social Links
    twitter: { type: String },
    github: { type: String },
    discord: { type: String },
    website: { type: String },

    // Preferences
    language: { type: String, enum: ["en", "pt-br", "es"], default: "en" },
    theme: { type: String, enum: ["light", "dark"], default: "dark" },
    isPublic: { type: Boolean, default: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBanned: { type: Boolean, default: false },

    // Gamification
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActive: { type: Date },
    activityDates: { type: [String], default: [] }, // "YYYY-MM-DD" for heatmap
    claimedStreakMilestones: { type: [Number], default: [] },

    wallets: [{
      publicKey: { type: String, required: true },
      isPrimary: { type: Boolean, default: false },
      linkedAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);