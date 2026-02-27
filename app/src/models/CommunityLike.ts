import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityLike extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  post_id?: mongoose.Types.ObjectId;
  comment_id?: mongoose.Types.ObjectId;
  created_at: Date;
}

const CommunityLikeSchema = new Schema<ICommunityLike>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    post_id: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityPost',
      index: true,
    },
    comment_id: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityComment',
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

// Ensure at least one of post_id or comment_id is provided
CommunityLikeSchema.pre('save', function (this: any) {
  if (!this.post_id && !this.comment_id) {
    throw new Error('Either post_id or comment_id must be provided');
  }
  if (this.post_id && this.comment_id) {
    throw new Error('Only one of post_id or comment_id should be provided');
  }
});

// Unique index to prevent duplicate likes
CommunityLikeSchema.index({ user_id: 1, post_id: 1 }, { unique: true, sparse: true });
CommunityLikeSchema.index({ user_id: 1, comment_id: 1 }, { unique: true, sparse: true });

export const CommunityLike: Model<ICommunityLike> =
  mongoose.models.CommunityLike ||
  mongoose.model<ICommunityLike>('CommunityLike', CommunityLikeSchema);
