import mongoose, { Schema, type Document } from "mongoose";

export interface ICertificate extends Document {
  wallet: string;
  courseId: string;
  courseTitle: string;
  trackId: number;
  xpEarned: number;
  txHash: string | null;
  issuedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>({
  wallet: { type: String, required: true, index: true },
  courseId: { type: String, required: true },
  courseTitle: { type: String, required: true },
  trackId: { type: Number, required: true },
  xpEarned: { type: Number, default: 0 },
  txHash: { type: String, default: null },
  issuedAt: { type: Date, default: Date.now },
});

CertificateSchema.index({ wallet: 1, courseId: 1 }, { unique: true });

export const Certificate =
  mongoose.models.Certificate ||
  mongoose.model<ICertificate>("Certificate", CertificateSchema);
