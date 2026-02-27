import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationPreferences {
  course_updates: boolean;
  streak_reminders: boolean;
  leaderboard_updates: boolean;
  new_challenges: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  wallet_address?: string;
  email?: string;
  google_id?: string;
  github_id?: string;
  full_name?: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  telegram?: string;
  discord?: string;
  medium?: string;
  youtube?: string;
  tiktok?: string;
  language: 'pt-br' | 'es' | 'en';
  theme: 'light' | 'dark' | 'system';
  role: 'user' | 'instructor' | 'moderator' | 'admin' | 'super_admin';
  is_active: boolean;
  total_xp: number;
  on_chain_xp: number;
  level: number;
  current_streak: number;
  courses_completed: number;
  last_activity_at?: Date;
  last_synced_at?: Date;
  profile_public: boolean;
  show_on_leaderboard: boolean;
  show_activity: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  notification_preferences: INotificationPreferences;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    wallet_address: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    google_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    github_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    full_name: {
      type: String,
      maxlength: 100,
    },
    display_name: {
      type: String,
      required: true,
      maxlength: 50,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      maxlength: 30,
    },
    avatar_url: String,
    bio: {
      type: String,
      maxlength: 500,
    },
    location: {
      type: String,
      maxlength: 100,
    },
    website: String,
    twitter: String,
    github: String,
    linkedin: String,
    facebook: String,
    instagram: String,
    whatsapp: String,
    telegram: String,
    discord: String,
    medium: String,
    youtube: String,
    tiktok: String,
    language: {
      type: String,
      enum: ['pt-br', 'es', 'en'],
      default: 'en',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    role: {
      type: String,
      enum: ['user', 'instructor', 'moderator', 'admin', 'super_admin'],
      default: 'user',
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    total_xp: {
      type: Number,
      default: 0,
      index: true,
    },
    on_chain_xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    current_streak: {
      type: Number,
      default: 0,
    },
    courses_completed: {
      type: Number,
      default: 0,
    },
    last_activity_at: {
      type: Date,
    },
    last_synced_at: {
      type: Date,
    },
    profile_public: {
      type: Boolean,
      default: true,
    },
    show_on_leaderboard: {
      type: Boolean,
      default: true,
    },
    show_activity: {
      type: Boolean,
      default: true,
    },
    email_notifications: {
      type: Boolean,
      default: true,
    },
    push_notifications: {
      type: Boolean,
      default: true,
    },
    notification_preferences: {
      course_updates: {
        type: Boolean,
        default: true,
      },
      streak_reminders: {
        type: Boolean,
        default: true,
      },
      leaderboard_updates: {
        type: Boolean,
        default: false,
      },
      new_challenges: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Calculate level from XP before saving
UserSchema.pre('save', function () {
  if (this.isModified('total_xp')) {
    this.level = Math.floor(Math.sqrt(this.total_xp / 100));
  }
});

// Indexes for common queries
UserSchema.index({ total_xp: -1 }); // Leaderboard sorting
UserSchema.index({ created_at: -1 }); // Recent users

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
