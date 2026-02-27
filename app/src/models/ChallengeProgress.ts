import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChallengeProgress extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  challenge_id: string;
  completed: boolean;
  completed_at?: Date;
  attempts: number;
  best_time_ms?: number;
  code_submitted?: string;
  tests_passed: number;
  tests_total: number;
  xp_earned: number;
  time_spent_seconds: number;
  created_at: Date;
  updated_at: Date;
}

const ChallengeProgressSchema = new Schema<IChallengeProgress>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challenge_id: {
      type: String,
      required: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completed_at: Date,
    attempts: {
      type: Number,
      default: 0,
    },
    best_time_ms: Number,
    code_submitted: String,
    tests_passed: {
      type: Number,
      default: 0,
    },
    tests_total: {
      type: Number,
      default: 0,
    },
    xp_earned: {
      type: Number,
      default: 0,
    },
    time_spent_seconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Unique compound index for user + challenge
ChallengeProgressSchema.index({ user_id: 1, challenge_id: 1 }, { unique: true });

export const ChallengeProgress: Model<IChallengeProgress> =
  mongoose.models.ChallengeProgress ||
  mongoose.model<IChallengeProgress>('ChallengeProgress', ChallengeProgressSchema);
