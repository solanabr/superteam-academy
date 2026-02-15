import mongoose, { Schema, type Document } from "mongoose";

export interface IReply extends Document {
  threadId: string;
  author: string;
  body: string;
  upvotes: string[];
  txHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    threadId: { type: String, required: true },
    author: { type: String, required: true },
    body: { type: String, required: true },
    upvotes: { type: [String], default: [] },
    txHash: { type: String, default: null },
  },
  { timestamps: true }
);

ReplySchema.index({ threadId: 1, createdAt: 1 });

export const Reply =
  mongoose.models.Reply || mongoose.model<IReply>("Reply", ReplySchema);
