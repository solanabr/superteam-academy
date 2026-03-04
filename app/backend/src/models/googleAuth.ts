import mongoose, { Document, Schema } from "mongoose";

export interface IGoogleAuth extends Document {
  userId: mongoose.Types.ObjectId;
  googleId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoogleAuthSchema = new Schema<IGoogleAuth>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
  },
  {
    timestamps: true,
  }
);

GoogleAuthSchema.index({ googleId: 1 });
GoogleAuthSchema.index({ userId: 1 });

export const GoogleAuth = mongoose.model<IGoogleAuth>("GoogleAuth", GoogleAuthSchema);