import mongoose, { Schema, type Document } from "mongoose";

export interface ICourse extends Document {
  courseId: string;
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  creator: string;
  difficulty: string;
  lessonCount: number;
  challengeCount: number;
  xpTotal: number;
  trackId: number;
  trackLevel: number;
  duration: string;
  prerequisiteId?: string;
  isActive: boolean;
  totalCompletions: number;
  totalEnrollments: number;
  modules: any[];
  createdAt: string;
  onChainTxHash?: string;
  onChainAddress?: string;
  contentTxId?: string;
}

const CourseSchema = new Schema<ICourse>({
  courseId: { type: String, required: true, unique: true },
  slug: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String },
  creator: { type: String, required: true },
  difficulty: { type: String, required: true },
  lessonCount: { type: Number, required: true },
  challengeCount: { type: Number, default: 0 },
  xpTotal: { type: Number, required: true },
  trackId: { type: Number, required: true },
  trackLevel: { type: Number, required: true },
  duration: { type: String, required: true },
  prerequisiteId: { type: String },
  isActive: { type: Boolean, default: true },
  totalCompletions: { type: Number, default: 0 },
  totalEnrollments: { type: Number, default: 0 },
  modules: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: String, required: true },
  onChainTxHash: { type: String },
  onChainAddress: { type: String },
  contentTxId: { type: String },
});

CourseSchema.index({ slug: 1 });
CourseSchema.index({ trackId: 1 });

export const CourseModel =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);
