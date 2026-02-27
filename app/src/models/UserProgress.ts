import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProgress extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  course_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at?: Date;
  xp_earned: number;
  time_spent_seconds: number;
  attempts: number;
  challenge_data?: {
    code_submitted?: string;
    tests_passed?: number;
    tests_total?: number;
    execution_time_ms?: number;
  };
  created_at: Date;
  updated_at: Date;
}

const UserProgressSchema = new Schema<IUserProgress>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course_id: {
      type: String,
      required: true,
      index: true,
    },
    lesson_id: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completed_at: Date,
    xp_earned: {
      type: Number,
      default: 0,
    },
    time_spent_seconds: {
      type: Number,
      default: 0,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    challenge_data: {
      code_submitted: String,
      tests_passed: Number,
      tests_total: Number,
      execution_time_ms: Number,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Compound index for efficient lookups
UserProgressSchema.index({ user_id: 1, course_id: 1 });
UserProgressSchema.index({ user_id: 1, course_id: 1, lesson_id: 1 }, { unique: true });

export const UserProgress: Model<IUserProgress> =
  mongoose.models.UserProgress || mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
