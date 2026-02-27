import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStreakHistoryEntry {
  date: Date;
  xp: number;
  lessons_completed: number;
  challenges_solved: number;
}

export interface IUserStreak extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date;
  streak_history: IStreakHistoryEntry[];
  freeze_available: boolean;
  freeze_used_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const StreakHistorySchema = new Schema<IStreakHistoryEntry>(
  {
    date: {
      type: Date,
      required: true,
    },
    xp: {
      type: Number,
      default: 0,
    },
    lessons_completed: {
      type: Number,
      default: 0,
    },
    challenges_solved: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const UserStreakSchema = new Schema<IUserStreak>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    current_streak: {
      type: Number,
      default: 0,
      index: true,
    },
    longest_streak: {
      type: Number,
      default: 0,
    },
    last_activity_date: {
      type: Date,
      default: null,
    },
    streak_history: {
      type: [StreakHistorySchema],
      default: [],
    },
    freeze_available: {
      type: Boolean,
      default: true,
    },
    freeze_used_date: Date,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Method to check and update streak
UserStreakSchema.methods.recordActivity = function (
  xp: number = 0,
  lessonsCompleted: number = 0,
  challengesSolved: number = 0
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = this.last_activity_date ? new Date(this.last_activity_date) : null;
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if already recorded activity today
  const todayEntry = this.streak_history.find((entry: IStreakHistoryEntry) => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  if (todayEntry) {
    // Update today's entry
    todayEntry.xp += xp;
    todayEntry.lessons_completed += lessonsCompleted;
    todayEntry.challenges_solved += challengesSolved;
  } else {
    // Add new entry for today
    this.streak_history.push({
      date: today,
      xp,
      lessons_completed: lessonsCompleted,
      challenges_solved: challengesSolved,
    });

    // Keep only last 365 days of history
    if (this.streak_history.length > 365) {
      this.streak_history = this.streak_history.slice(-365);
    }

    // Update streak
    if (!lastActivity) {
      // First activity ever
      this.current_streak = 1;
    } else if (lastActivity.getTime() === yesterday.getTime()) {
      // Consecutive day
      this.current_streak += 1;
    } else if (lastActivity.getTime() === today.getTime()) {
      // Same day, no change
    } else {
      // Streak broken
      this.current_streak = 1;
    }

    // Update longest streak
    if (this.current_streak > this.longest_streak) {
      this.longest_streak = this.current_streak;
    }

    this.last_activity_date = today;
  }

  return this;
};

// Index for leaderboard queries
UserStreakSchema.index({ current_streak: -1 });
UserStreakSchema.index({ longest_streak: -1 });

export const UserStreak: Model<IUserStreak> =
  mongoose.models.UserStreak || mongoose.model<IUserStreak>('UserStreak', UserStreakSchema);
