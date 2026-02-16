import mongoose, { Schema, type Document } from "mongoose";

export type ThreadType = "discussion" | "question";

export interface IThread extends Document {
  author: string;
  title: string;
  body: string;
  type: ThreadType;
  tags: string[];
  views: number;
  upvotes: string[];
  isPinned: boolean;
  isSolved: boolean;
  solvedReplyId: string | null;
  replyCount: number;
  txHash: string | null;
  bountyLamports: number;
  bountyPaid: boolean;
  bountyTxHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
  {
    author: { $type: String, required: true, index: true },
    title: { $type: String, required: true },
    body: { $type: String, required: true },
    type: { $type: String, enum: ["discussion", "question"], default: "discussion" },
    tags: { $type: [String], default: [] },
    views: { $type: Number, default: 0 },
    upvotes: { $type: [String], default: [] },
    isPinned: { $type: Boolean, default: false },
    isSolved: { $type: Boolean, default: false },
    solvedReplyId: { $type: String, default: null },
    replyCount: { $type: Number, default: 0 },
    txHash: { $type: String, default: null },
    bountyLamports: { $type: Number, default: 0 },
    bountyPaid: { $type: Boolean, default: false },
    bountyTxHash: { $type: String, default: null },
  },
  { timestamps: true, typeKey: "$type" }
);

ThreadSchema.index({ createdAt: -1 });
ThreadSchema.index({ tags: 1 });
ThreadSchema.index({ type: 1 });

export const Thread =
  mongoose.models.Thread || mongoose.model<IThread>("Thread", ThreadSchema);
