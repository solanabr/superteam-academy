import mongoose, { Schema, type Document } from "mongoose";

export interface IEnrollment extends Document {
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  lessonsCompleted: number[];
  totalLessons: number;
  percentComplete: number;
  lessonTxHashes: Map<string, string>;
  enrollTxHash?: string;
  completionTxHash?: string;
}

const EnrollmentSchema = new Schema<IEnrollment>({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: undefined },
  lessonsCompleted: { type: [Number], default: [] },
  totalLessons: { type: Number, required: true },
  percentComplete: { type: Number, default: 0 },
  lessonTxHashes: { type: Map, of: String, default: new Map() },
  enrollTxHash: { type: String, default: undefined },
  completionTxHash: { type: String, default: undefined },
});

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ courseId: 1 });

export const Enrollment =
  mongoose.models.Enrollment ||
  mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
