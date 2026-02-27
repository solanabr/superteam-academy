import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserAchievement extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  achievement_id: string;
  achievement_name: string;
  achievement_description: string;
  achievement_icon: string;
  xp_reward: number;
  earned_at: Date;
  created_at: Date;
}

const UserAchievementSchema = new Schema<IUserAchievement>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    achievement_id: {
      type: String,
      required: true,
    },
    achievement_name: {
      type: String,
      required: true,
    },
    achievement_description: String,
    achievement_icon: String,
    xp_reward: {
      type: Number,
      default: 0,
    },
    earned_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

// Prevent duplicate achievements
UserAchievementSchema.index({ user_id: 1, achievement_id: 1 }, { unique: true });

export const UserAchievement: Model<IUserAchievement> =
  mongoose.models.UserAchievement ||
  mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);
