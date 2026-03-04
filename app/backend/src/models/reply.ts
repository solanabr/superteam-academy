import mongoose, { Document, Schema } from "mongoose";

export interface IReply extends Document {
    threadId: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    body: string;                              // Markdown
    parentReplyId?: mongoose.Types.ObjectId;  // One level of nesting

    upvotes: mongoose.Types.ObjectId[];        // User IDs who upvoted
    isAccepted: boolean;                       // Accepted answer (Q&A)
    isDeleted: boolean;                        // Soft delete

    createdAt: Date;
    updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
    {
        threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true },
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        body: { type: String, required: true },
        parentReplyId: { type: Schema.Types.ObjectId, ref: "Reply" },

        upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        isAccepted: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

ReplySchema.index({ threadId: 1, createdAt: 1 });  // Primary: get thread replies in order
ReplySchema.index({ author: 1 });
ReplySchema.index({ isAccepted: 1, threadId: 1 }); // Find accepted answer quickly

export const Reply = mongoose.model<IReply>("Reply", ReplySchema);
