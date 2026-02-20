import mongoose, { Document, Schema } from "mongoose";

// ─── Test Attempt ─────────────────────────────────────────────────────────────

export interface ITestAttempt {
  testId: mongoose.Types.ObjectId;
  score: number;          // Percentage 0-100
  passed: boolean;        // score >= 80
  attempts: number;       // Unlimited retakes allowed
  lastAttemptAt: Date;
}

// ─── Milestone Progress ───────────────────────────────────────────────────────

export interface IMilestoneProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  milestoneId: mongoose.Types.ObjectId;
  milestoneOrder: number;   // 1-5, stored for quick sorting without population

  // Test tracking
  testAttempts: ITestAttempt[];
  allTestsPassed: boolean;  // true when every test in this milestone has passed

  // XP state — locked until ALL 5 milestones completed
  xpReward: number;         // Copied from milestone at enrollment time
  isXPUnlocked: boolean;    // Unlocked when course is fully complete
  isXPClaimed: boolean;     // User hit the claim button
  xpClaimedAt?: Date;

  completedAt?: Date;       // When allTestsPassed first became true
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const TestAttemptSchema = new Schema<ITestAttempt>(
  {
    testId: { type: Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    passed: { type: Boolean, required: true },
    attempts: { type: Number, default: 1 },
    lastAttemptAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MilestoneProgressSchema = new Schema<IMilestoneProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    milestoneId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    milestoneOrder: { type: Number, required: true, min: 1, max: 5 },

    // Test tracking
    testAttempts: [TestAttemptSchema],
    allTestsPassed: { type: Boolean, default: false },

    // XP state
    xpReward: { type: Number, required: true },
    isXPUnlocked: { type: Boolean, default: false },
    isXPClaimed: { type: Boolean, default: false },
    xpClaimedAt: { type: Date },

    completedAt: { type: Date },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary lookup — find all milestone progress for a user in a course
MilestoneProgressSchema.index({ userId: 1, courseId: 1 });

// Find a specific milestone's progress for a user
MilestoneProgressSchema.index({ userId: 1, courseId: 1, milestoneId: 1 }, { unique: true });

// For checking XP claim status across a course
MilestoneProgressSchema.index({ userId: 1, courseId: 1, isXPClaimed: 1 });

export const MilestoneProgress = mongoose.model<IMilestoneProgress>(
  "MilestoneProgress",
  MilestoneProgressSchema
);