import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourseEnrollment extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  course_id: string;
  course_slug: string;
  enrolled_at: Date;
  completed_at?: Date;
  progress_percentage: number;
  lessons_completed: number;
  total_lessons: number;
  challenges_solved: number;
  total_challenges: number;
  xp_earned: number;
  certificate_issued: boolean;
  certificate_mint_address?: string;
  last_accessed_at: Date;
  created_at: Date;
  updated_at: Date;
}

const CourseEnrollmentSchema = new Schema<ICourseEnrollment>(
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
    },
    course_slug: {
      type: String,
      required: true,
    },
    enrolled_at: {
      type: Date,
      default: Date.now,
    },
    completed_at: Date,
    progress_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lessons_completed: {
      type: Number,
      default: 0,
    },
    total_lessons: {
      type: Number,
      default: 0,
    },
    challenges_solved: {
      type: Number,
      default: 0,
    },
    total_challenges: {
      type: Number,
      default: 0,
    },
    xp_earned: {
      type: Number,
      default: 0,
    },
    certificate_issued: {
      type: Boolean,
      default: false,
    },
    certificate_mint_address: String,
    last_accessed_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Prevent duplicate enrollments
CourseEnrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

// Indexes for common queries
CourseEnrollmentSchema.index({ user_id: 1, last_accessed_at: -1 });
CourseEnrollmentSchema.index({ course_id: 1, progress_percentage: -1 });

export const CourseEnrollment: Model<ICourseEnrollment> =
  mongoose.models.CourseEnrollment ||
  mongoose.model<ICourseEnrollment>('CourseEnrollment', CourseEnrollmentSchema);
