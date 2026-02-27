import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * XP Transaction Schema
 * Records all XP-earning activities for audit trail
 */

export interface IXPTransaction extends Document {
  userId: string;
  amount: number;
  type:
    | 'lesson_complete'
    | 'challenge_complete'
    | 'course_complete'
    | 'streak_bonus'
    | 'daily_first'
    | 'achievement'
    | 'bonus';
  source: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const XPTransactionSchema = new Schema<IXPTransaction>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'lesson_complete',
        'challenge_complete',
        'course_complete',
        'streak_bonus',
        'daily_first',
        'achievement',
        'bonus',
      ],
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
XPTransactionSchema.index({ userId: 1, createdAt: -1 });
XPTransactionSchema.index({ userId: 1, type: 1 });

/**
 * User Gamification Schema
 * Stores XP, streak, and achievement data for each user
 */

export interface IUserGamification extends Document {
  userId: string;
  totalXP: number;

  // Streak data
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakFreezes: number;

  // Stats
  lessonsCompleted: number;
  coursesCompleted: number;
  challengesCompleted: number;
  totalTimeSpent: number;

  // Achievement IDs that user has unlocked
  achievements: Array<{
    achievementId: string;
    unlockedAt: Date;
    nftMintAddress?: string;
  }>;

  // Daily activity tracking
  dailyActivity: Map<
    string,
    {
      xpEarned: number;
      lessonsCompleted: number;
      firstCompletionClaimed: boolean;
    }
  >;

  createdAt: Date;
  updatedAt: Date;
}

const UserGamificationSchema = new Schema<IUserGamification>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalXP: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: String,
      default: null,
    },
    streakFreezes: {
      type: Number,
      default: 0,
    },
    lessonsCompleted: {
      type: Number,
      default: 0,
    },
    coursesCompleted: {
      type: Number,
      default: 0,
    },
    challengesCompleted: {
      type: Number,
      default: 0,
    },
    totalTimeSpent: {
      type: Number,
      default: 0,
    },
    achievements: [
      {
        achievementId: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
        nftMintAddress: { type: String },
      },
    ],
    dailyActivity: {
      type: Map,
      of: {
        xpEarned: { type: Number, default: 0 },
        lessonsCompleted: { type: Number, default: 0 },
        firstCompletionClaimed: { type: Boolean, default: false },
      },
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Index for leaderboard queries
UserGamificationSchema.index({ totalXP: -1 });
UserGamificationSchema.index({ currentStreak: -1 });

// Ensure models are only compiled once
export const XPTransaction: Model<IXPTransaction> =
  mongoose.models.XPTransaction ||
  mongoose.model<IXPTransaction>('XPTransaction', XPTransactionSchema);

export const UserGamification: Model<IUserGamification> =
  mongoose.models.UserGamification ||
  mongoose.model<IUserGamification>('UserGamification', UserGamificationSchema);
