import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityComment extends Document {
  _id: mongoose.Types.ObjectId;
  post_id: mongoose.Types.ObjectId;
  author_id: mongoose.Types.ObjectId;
  content: string;
  likes_count: number;
  created_at: Date;
  updated_at: Date;
}

const CommunityCommentSchema = new Schema<ICommunityComment>(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: true,
      index: true,
    },
    author_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    likes_count: {
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

export const CommunityComment: Model<ICommunityComment> =
  mongoose.models.CommunityComment ||
  mongoose.model<ICommunityComment>('CommunityComment', CommunityCommentSchema);
