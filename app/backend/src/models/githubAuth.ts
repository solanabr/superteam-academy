import mongoose, { Document, Schema } from "mongoose";

export interface IGithubAuth extends Document {
  userId: mongoose.Types.ObjectId;
  githubId: string;
  username: string;
  email?: string;
  accessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GithubAuthSchema = new Schema<IGithubAuth>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    githubId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String },
    accessToken: { type: String },
  },
  {
    timestamps: true,
  }
);

GithubAuthSchema.index({ githubId: 1 });
GithubAuthSchema.index({ userId: 1 });

export const GithubAuth = mongoose.model<IGithubAuth>("GithubAuth", GithubAuthSchema);