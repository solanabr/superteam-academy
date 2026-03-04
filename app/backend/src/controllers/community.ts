import { Request, Response } from "express";
import mongoose from "mongoose";
import { Thread } from "../models/thread";
import { Reply } from "../models/reply";
import { awardAchievement } from "../services/achievements";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isOwnerOrAdmin = (resourceAuthorId: string, userId: string, role: string) =>
    resourceAuthorId === userId || role === "admin";

// ─── GET /community/threads ───────────────────────────────────────────────────

/**
 * GET /api/v1/community/threads
 * Paginated thread list.
 * Query params: type, courseId, tag, solved, sort (latest|top), page, limit
 */
export const getThreads = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            type,
            courseId,
            tag,
            solved,
            sort = "latest",
            page = "1",
            limit = "20",
        } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, any> = { isDeleted: false };

        if (type) filter.type = type;
        if (courseId) filter.courseId = courseId;
        if (tag) filter.tags = tag;
        if (solved !== undefined) filter.isSolved = solved === "true";

        const sortOrder: Record<string, any> =
            sort === "top"
                ? { isPinned: -1, "upvotes.length": -1, lastActivityAt: -1 }
                : { isPinned: -1, lastActivityAt: -1 };

        const [threads, total] = await Promise.all([
            Thread.find(filter)
                .populate("author", "username name avatar level")
                .select("-body") // Omit body in list view — send only in detail
                .sort(sort === "top" ? { isPinned: -1, replyCount: -1, lastActivityAt: -1 } : { isPinned: -1, lastActivityAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Thread.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: threads,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        console.error("[getThreads] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── POST /community/threads ──────────────────────────────────────────────────

/**
 * POST /api/v1/community/threads
 * Create a new thread.
 */
export const createThread = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { title, body, type, tags, courseId, milestoneId } = req.body;

        if (!title?.trim() || !body?.trim()) {
            res.status(400).json({ success: false, message: "title and body are required" });
            return;
        }

        const thread = await Thread.create({
            title: title.trim(),
            body: body.trim(),
            author: new mongoose.Types.ObjectId(userId),
            type: type || "discussion",
            tags: Array.isArray(tags) ? tags.map((t: string) => t.toLowerCase().trim()) : [],
            courseId: courseId || undefined,
            milestoneId: milestoneId || undefined,
            lastActivityAt: new Date(),
        });

        const populated = await thread.populate("author", "username name avatar level");

        res.status(201).json({
            success: true,
            message: "Thread created",
            data: populated,
        });
    } catch (err) {
        console.error("[createThread] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET /community/threads/:id ───────────────────────────────────────────────

/**
 * GET /api/v1/community/threads/:id
 * Returns full thread + paginated replies.
 * Query: replyPage, replyLimit
 */
export const getThread = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { replyPage = "1", replyLimit = "50" } = req.query;

        const replyPageNum = Math.max(1, parseInt(replyPage as string, 10));
        const replyLimitNum = Math.min(100, Math.max(1, parseInt(replyLimit as string, 10)));
        const replySkip = (replyPageNum - 1) * replyLimitNum;

        const thread = await Thread.findOne({ _id: id, isDeleted: false })
            .populate("author", "username name avatar level")
            .lean();

        if (!thread) {
            res.status(404).json({ success: false, message: "Thread not found" });
            return;
        }

        // Increment view count (fire-and-forget)
        Thread.findByIdAndUpdate(id, { $inc: { views: 1 } }).catch(() => { });

        // Fetch replies (excluding soft-deleted at query level for performance)
        const [replies, replyTotal] = await Promise.all([
            Reply.find({ threadId: id, isDeleted: false })
                .populate("author", "username name avatar level")
                .sort({ isAccepted: -1, createdAt: 1 }) // Accepted answer floats to top
                .skip(replySkip)
                .limit(replyLimitNum)
                .lean(),
            Reply.countDocuments({ threadId: id, isDeleted: false }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                thread,
                replies,
                replyPagination: {
                    total: replyTotal,
                    page: replyPageNum,
                    limit: replyLimitNum,
                    totalPages: Math.ceil(replyTotal / replyLimitNum),
                },
            },
        });
    } catch (err) {
        console.error("[getThread] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── PATCH /community/threads/:id ────────────────────────────────────────────

/**
 * PATCH /api/v1/community/threads/:id
 * Edit thread title/body/tags. Owner or admin only.
 */
export const updateThread = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role ?? "user";
        const { id } = req.params;
        const { title, body, tags } = req.body;

        const thread = await Thread.findOne({ _id: id, isDeleted: false });
        if (!thread) {
            res.status(404).json({ success: false, message: "Thread not found" });
            return;
        }

        if (!isOwnerOrAdmin(thread.author.toString(), userId, userRole)) {
            res.status(403).json({ success: false, message: "Not authorised" });
            return;
        }

        if (title) thread.title = title.trim();
        if (body) thread.body = body.trim();
        if (tags) thread.tags = tags.map((t: string) => t.toLowerCase().trim());

        await thread.save();

        res.status(200).json({ success: true, message: "Thread updated", data: thread });
    } catch (err) {
        console.error("[updateThread] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── DELETE /community/threads/:id ───────────────────────────────────────────

/**
 * DELETE /api/v1/community/threads/:id
 * Soft-delete a thread. Owner or admin only.
 */
export const deleteThread = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role ?? "user";
        const { id } = req.params;

        const thread = await Thread.findOne({ _id: id, isDeleted: false });
        if (!thread) {
            res.status(404).json({ success: false, message: "Thread not found" });
            return;
        }

        if (!isOwnerOrAdmin(thread.author.toString(), userId, userRole)) {
            res.status(403).json({ success: false, message: "Not authorised" });
            return;
        }

        thread.isDeleted = true;
        await thread.save();

        res.status(200).json({ success: true, message: "Thread deleted" });
    } catch (err) {
        console.error("[deleteThread] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── POST /community/threads/:id/vote ────────────────────────────────────────

/**
 * POST /api/v1/community/threads/:id/vote
 * Toggle upvote on a thread. (upvote if not voted, remove if already voted)
 */
export const voteThread = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const userObjId = new mongoose.Types.ObjectId(userId);

        const thread = await Thread.findOne({ _id: id, isDeleted: false });
        if (!thread) {
            res.status(404).json({ success: false, message: "Thread not found" });
            return;
        }

        const alreadyVoted = thread.upvotes.some((uid) => uid.equals(userObjId));

        if (alreadyVoted) {
            thread.upvotes = thread.upvotes.filter((uid) => !uid.equals(userObjId));
        } else {
            thread.upvotes.push(userObjId);
        }

        await thread.save();

        res.status(200).json({
            success: true,
            message: alreadyVoted ? "Upvote removed" : "Upvoted",
            data: { upvotes: thread.upvotes.length },
        });
    } catch (err) {
        console.error("[voteThread] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── POST /community/threads/:id/replies ─────────────────────────────────────

/**
 * POST /api/v1/community/threads/:id/replies
 * Post a reply (or nested reply via parentReplyId).
 */
export const createReply = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { id: threadId } = req.params;
        const { body, parentReplyId } = req.body;

        if (!body?.trim()) {
            res.status(400).json({ success: false, message: "body is required" });
            return;
        }

        const thread = await Thread.findOne({ _id: threadId, isDeleted: false });
        if (!thread) {
            res.status(404).json({ success: false, message: "Thread not found" });
            return;
        }

        if (thread.isLocked) {
            res.status(403).json({ success: false, message: "This thread is locked" });
            return;
        }

        // Validate parent reply if provided
        if (parentReplyId) {
            const parent = await Reply.findOne({ _id: parentReplyId, threadId, isDeleted: false });
            if (!parent) {
                res.status(404).json({ success: false, message: "Parent reply not found" });
                return;
            }
        }

        const reply = await Reply.create({
            threadId: new mongoose.Types.ObjectId(threadId),
            author: new mongoose.Types.ObjectId(userId),
            body: body.trim(),
            parentReplyId: parentReplyId ? new mongoose.Types.ObjectId(parentReplyId) : undefined,
        });

        // Update thread: bump replyCount + lastActivityAt
        await Thread.findByIdAndUpdate(threadId, {
            $inc: { replyCount: 1 },
            $set: { lastActivityAt: new Date() },
        });

        const populated = await reply.populate("author", "username name avatar level");

        // Award community achievements (fire-and-forget)
        awardAchievement(userId, "first_comment").catch((err) =>
            console.error("[createReply] achievement error:", err)
        );

        res.status(201).json({
            success: true,
            message: "Reply posted",
            data: populated,
        });
    } catch (err) {
        console.error("[createReply] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── POST /community/threads/:id/replies/:replyId/vote ───────────────────────

/**
 * POST /api/v1/community/threads/:id/replies/:replyId/vote
 * Toggle upvote on a reply.
 */
export const voteReply = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { replyId } = req.params;
        const userObjId = new mongoose.Types.ObjectId(userId);

        const reply = await Reply.findOne({ _id: replyId, isDeleted: false });
        if (!reply) {
            res.status(404).json({ success: false, message: "Reply not found" });
            return;
        }

        const alreadyVoted = reply.upvotes.some((uid) => uid.equals(userObjId));

        if (alreadyVoted) {
            reply.upvotes = reply.upvotes.filter((uid) => !uid.equals(userObjId));
        } else {
            reply.upvotes.push(userObjId);
        }

        await reply.save();

        res.status(200).json({
            success: true,
            message: alreadyVoted ? "Upvote removed" : "Upvoted",
            data: { upvotes: reply.upvotes.length },
        });
    } catch (err) {
        console.error("[voteReply] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── POST /community/threads/:id/replies/:replyId/accept ─────────────────────

/**
 * POST /api/v1/community/threads/:id/replies/:replyId/accept
 * Accept a reply as the answer. Thread author or admin only.
 * Also marks the thread as solved.
 */
export const acceptReply = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role ?? "user";
        const { id: threadId, replyId } = req.params;

        const thread = await Thread.findOne({ _id: threadId, isDeleted: false });
        if (!thread) {
            res.status(404).json({ success: false, message: "Thread not found" });
            return;
        }

        if (!isOwnerOrAdmin(thread.author.toString(), userId, userRole)) {
            res.status(403).json({ success: false, message: "Only the thread author can accept an answer" });
            return;
        }

        const reply = await Reply.findOne({ _id: replyId, threadId, isDeleted: false });
        if (!reply) {
            res.status(404).json({ success: false, message: "Reply not found" });
            return;
        }

        // Unaccept any previously accepted reply
        await Reply.updateMany({ threadId }, { isAccepted: false });

        reply.isAccepted = true;
        await reply.save();

        thread.isSolved = true;
        thread.acceptedReplyId = reply._id as mongoose.Types.ObjectId;
        await thread.save();

        // Award "helper" badge to the reply author (fire-and-forget)
        awardAchievement(reply.author.toString(), "helper").catch((err) =>
            console.error("[acceptReply] helper achievement error:", err)
        );

        res.status(200).json({
            success: true,
            message: "Answer accepted — thread marked as solved",
            data: { replyId: reply._id, isSolved: true },
        });
    } catch (err) {
        console.error("[acceptReply] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── DELETE /community/threads/:id/replies/:replyId ──────────────────────────

/**
 * DELETE /api/v1/community/threads/:id/replies/:replyId
 * Soft-delete a reply. Owner or admin only.
 */
export const deleteReply = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role ?? "user";
        const { id: threadId, replyId } = req.params;

        const reply = await Reply.findOne({ _id: replyId, threadId, isDeleted: false });
        if (!reply) {
            res.status(404).json({ success: false, message: "Reply not found" });
            return;
        }

        if (!isOwnerOrAdmin(reply.author.toString(), userId, userRole)) {
            res.status(403).json({ success: false, message: "Not authorised" });
            return;
        }

        reply.isDeleted = true;
        await reply.save();

        // Decrement thread reply count
        await Thread.findByIdAndUpdate(threadId, { $inc: { replyCount: -1 } });

        res.status(200).json({ success: true, message: "Reply deleted" });
    } catch (err) {
        console.error("[deleteReply] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── Admin: Pin / Lock ────────────────────────────────────────────────────────

/**
 * PATCH /api/v1/community/threads/:id/pin
 * Toggle pin. Admin only.
 */
export const pinThread = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const thread = await Thread.findOneAndUpdate(
            { _id: id, isDeleted: false },
            [{ $set: { isPinned: { $not: "$isPinned" } } }],
            { new: true }
        );

        if (!thread) {
            res.status(404).json({ success: false, message: "Thread not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: thread.isPinned ? "Thread pinned" : "Thread unpinned",
            data: { isPinned: thread.isPinned },
        });
    } catch (err) {
        console.error("[pinThread] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * PATCH /api/v1/community/threads/:id/lock
 * Toggle lock. Admin only.
 */
export const lockThread = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const thread = await Thread.findOneAndUpdate(
            { _id: id, isDeleted: false },
            [{ $set: { isLocked: { $not: "$isLocked" } } }],
            { new: true }
        );

        if (!thread) {
            res.status(404).json({ success: false, message: "Thread not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: thread.isLocked ? "Thread locked" : "Thread unlocked",
            data: { isLocked: thread.isLocked },
        });
    } catch (err) {
        console.error("[lockThread] error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
