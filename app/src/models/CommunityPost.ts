import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  category: 'Help' | 'Discussion' | 'Announcements' | 'Achievements' | 'Study Groups';
  is_pinned: boolean;
  is_announcement: boolean;
  replies_count: number;
  likes_count: number;
  views_count: number;
  created_at: Date;
  updated_at: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['Help', 'Discussion', 'Announcements', 'Achievements', 'Study Groups'],
      default: 'Discussion',
      index: true,
    },
    is_pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    is_announcement: {
      type: Boolean,
      default: false,
      index: true,
    },
    replies_count: {
      type: Number,
      default: 0,
    },
    likes_count: {
      type: Number,
      default: 0,
    },
    views_count: {
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

export const CommunityPost: Model<ICommunityPost> =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
