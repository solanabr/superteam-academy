import mongoose, { Schema, type Document } from "mongoose";

export interface IEnrollment extends Document {
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  lessonsCompleted: number[];
  totalLessons: number;
  percentComplete: number;
}

const EnrollmentSchema = new Schema<IEnrollment>({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: undefined },
  lessonsCompleted: { type: [Number], default: [] },
  totalLessons: { type: Number, required: true },
  percentComplete: { type: Number, default: 0 },
});

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ courseId: 1 });

export const Enrollment =
  mongoose.models.Enrollment ||
  mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
