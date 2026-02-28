import mongoose, { Document, Schema } from "mongoose";

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  lastAccessedAt: Date;
  completedAt?: Date;
  rating?: number;
  comment?: string;
  ratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
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
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true },
    ratedAt: { type: Date },
    enrolledAt: { type: Date, default: Date.now },
    lastAccessedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// A user can only enroll once per course
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ userId: 1 });
EnrollmentSchema.index({ courseId: 1 });

export const Enrollment = mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);