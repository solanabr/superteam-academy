import mongoose, { Document, Schema } from "mongoose";

export type ThreadType = "discussion" | "question";

export interface IThread extends Document {
    title: string;
    body: string;                              // Markdown
    author: mongoose.Types.ObjectId;
    type: ThreadType;
    tags: string[];
    courseId?: mongoose.Types.ObjectId;        // Optional course context
    milestoneId?: string;                      // Optional milestone context

    // Engagement
    upvotes: mongoose.Types.ObjectId[];        // User IDs who upvoted
    views: number;

    // Moderation
    isPinned: boolean;
    isLocked: boolean;                         // No new replies when locked
    isDeleted: boolean;                        // Soft delete

    // Q&A
    isSolved: boolean;                         // Only for "question" type
    acceptedReplyId?: mongoose.Types.ObjectId;

    // Denormalized
    replyCount: number;
    lastActivityAt: Date;

    createdAt: Date;
    updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        body: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["discussion", "question"], default: "discussion" },
        tags: [{ type: String, trim: true, lowercase: true }],
        courseId: { type: Schema.Types.ObjectId, ref: "Course" },
        milestoneId: { type: String },

        upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        views: { type: Number, default: 0 },

        isPinned: { type: Boolean, default: false },
        isLocked: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },

        isSolved: { type: Boolean, default: false },
        acceptedReplyId: { type: Schema.Types.ObjectId, ref: "Reply" },

        replyCount: { type: Number, default: 0 },
        lastActivityAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

ThreadSchema.index({ isDeleted: 1, lastActivityAt: -1 });   // Default feed
ThreadSchema.index({ courseId: 1, isDeleted: 1 });          // Course-scoped threads
ThreadSchema.index({ author: 1 });
ThreadSchema.index({ tags: 1 });
ThreadSchema.index({ isPinned: -1, lastActivityAt: -1 });   // Catalog: pinned first

export const Thread = mongoose.model<IThread>("Thread", ThreadSchema);
