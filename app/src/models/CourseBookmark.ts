import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourseBookmark extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  course_id: string;
  course_slug: string;
  created_at: Date;
  updated_at: Date;
}

const CourseBookmarkSchema = new Schema<ICourseBookmark>(
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
    course_slug: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

CourseBookmarkSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
CourseBookmarkSchema.index({ user_id: 1, created_at: -1 });

export const CourseBookmark: Model<ICourseBookmark> =
  mongoose.models.CourseBookmark ||
  mongoose.model<ICourseBookmark>('CourseBookmark', CourseBookmarkSchema);
