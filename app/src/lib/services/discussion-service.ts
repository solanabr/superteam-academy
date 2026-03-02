import { prisma } from "@/lib/db";
import type {
  ThreadListItem,
  ThreadDetail,
  CommentNode,
  ThreadAuthor,
  ThreadListParams,
  ThreadListResponse,
  VoteValue,
} from "@/types";

const PAGE_SIZE = 20;

function toAuthor(user: { id: string; displayName: string | null; name: string | null; image: string | null }): ThreadAuthor {
  return {
    id: user.id,
    displayName: user.displayName ?? user.name ?? "Anonymous",
    image: user.image,
  };
}

export class DiscussionService {
  // ── Threads ─────────────────────────────────────────────────────────────────

  async listThreads(params: ThreadListParams, userId?: string | null): Promise<ThreadListResponse> {
    const { scope, category, lessonId, sort = "newest", search, cursor, limit = PAGE_SIZE } = params;

    const where: Record<string, unknown> = {};
    if (scope) where.scope = scope;
    if (category) where.category = category;
    if (lessonId) where.lessonId = lessonId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { preview: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "top" ? { voteScore: "desc" as const } :
      sort === "mostCommented" ? { commentCount: "desc" as const } :
      { createdAt: "desc" as const };

    const rows = await prisma.thread.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, orderBy],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: { select: { id: true, displayName: true, name: true, image: true } },
        votes: userId ? { where: { userId }, select: { value: true } } : false,
      },
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const threads: ThreadListItem[] = items.map((t) => ({
      id: t.id,
      title: t.title,
      preview: t.preview,
      scope: t.scope as ThreadListItem["scope"],
      category: t.category as ThreadListItem["category"],
      tags: t.tags,
      author: toAuthor(t.author),
      voteScore: t.voteScore,
      commentCount: t.commentCount,
      viewCount: t.viewCount,
      userVote: (t.votes && t.votes.length > 0 ? t.votes[0].value : 0) as VoteValue,
      isPinned: t.isPinned,
      createdAt: t.createdAt.toISOString(),
    }));

    return {
      threads,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async getThread(threadId: string, userId?: string | null): Promise<ThreadDetail | null> {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        author: { select: { id: true, displayName: true, name: true, image: true } },
        votes: userId ? { where: { userId }, select: { value: true } } : false,
        comments: {
          orderBy: { path: "asc" },
          include: {
            author: { select: { id: true, displayName: true, name: true, image: true } },
            votes: userId ? { where: { userId }, select: { value: true } } : false,
          },
        },
      },
    });

    if (!thread) return null;

    const comments: CommentNode[] = thread.comments.map((c) => ({
      id: c.id,
      parentId: c.parentId,
      depth: c.depth,
      body: c.isDeleted ? "[deleted]" : c.body,
      author: c.isDeleted
        ? { id: "", displayName: "[deleted]", image: null }
        : toAuthor(c.author),
      voteScore: c.voteScore,
      userVote: (c.votes && c.votes.length > 0 ? c.votes[0].value : 0) as VoteValue,
      isDeleted: c.isDeleted,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      preview: thread.preview,
      scope: thread.scope as ThreadDetail["scope"],
      category: thread.category as ThreadDetail["category"],
      tags: thread.tags,
      author: toAuthor(thread.author),
      voteScore: thread.voteScore,
      commentCount: thread.commentCount,
      viewCount: thread.viewCount,
      userVote: (thread.votes && thread.votes.length > 0 ? thread.votes[0].value : 0) as VoteValue,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      comments,
    };
  }

  async createThread(authorId: string, data: {
    title: string;
    body: string;
    scope: string;
    category?: string;
    tags?: string[];
    lessonId?: string;
    courseId?: string;
  }): Promise<{ id: string }> {
    const preview = data.body.slice(0, 160);
    const thread = await prisma.thread.create({
      data: {
        title: data.title,
        body: data.body,
        preview,
        scope: data.scope,
        category: data.category,
        tags: data.tags ?? [],
        lessonId: data.lessonId,
        courseId: data.courseId,
        authorId,
      },
      select: { id: true },
    });
    return thread;
  }

  async updateThread(threadId: string, userId: string, data: {
    title?: string;
    body?: string;
    isPinned?: boolean;
    isLocked?: boolean;
  }, isAdmin: boolean): Promise<void> {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { authorId: true },
    });
    if (!thread) throw new Error("Not found");

    const isOwner = thread.authorId === userId;
    if (!isOwner && !isAdmin) throw new Error("Forbidden");

    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.body !== undefined) {
      update.body = data.body;
      update.preview = data.body.slice(0, 160);
    }
    if (isAdmin) {
      if (data.isPinned !== undefined) update.isPinned = data.isPinned;
      if (data.isLocked !== undefined) update.isLocked = data.isLocked;
    }

    await prisma.thread.update({ where: { id: threadId }, data: update });
  }

  async deleteThread(threadId: string, userId: string, isAdmin: boolean): Promise<void> {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { authorId: true },
    });
    if (!thread) throw new Error("Not found");
    if (thread.authorId !== userId && !isAdmin) throw new Error("Forbidden");

    await prisma.thread.delete({ where: { id: threadId } });
  }

  // ── Comments ────────────────────────────────────────────────────────────────

  async createComment(threadId: string, authorId: string, data: {
    body: string;
    parentId?: string;
  }): Promise<CommentNode> {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { isLocked: true },
    });
    if (!thread) throw new Error("Not found");
    if (thread.isLocked) throw new Error("Locked");

    let parentPath = "";
    let depth = 0;
    let parentAuthorId: string | null = null;

    if (data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: data.parentId },
        select: { path: true, depth: true, authorId: true },
      });
      if (!parent) throw new Error("Parent not found");
      parentPath = parent.path;
      depth = parent.depth + 1;
      parentAuthorId = parent.authorId;
    }

    const comment = await prisma.comment.create({
      data: {
        threadId,
        parentId: data.parentId ?? null,
        path: "", // placeholder, will update
        depth,
        body: data.body,
        authorId,
      },
      include: {
        author: { select: { id: true, displayName: true, name: true, image: true } },
      },
    });

    // Set materialized path now that we have the ID
    const path = parentPath ? `${parentPath}/${comment.id}` : `/${comment.id}`;
    await prisma.comment.update({
      where: { id: comment.id },
      data: { path },
    });

    // Increment thread comment count
    await prisma.thread.update({
      where: { id: threadId },
      data: { commentCount: { increment: 1 } },
    });

    // Create reply notification if replying to another user
    if (parentAuthorId && parentAuthorId !== authorId) {
      await prisma.notification.create({
        data: {
          userId: parentAuthorId,
          type: "reply",
          title: "New reply to your comment",
          body: data.body.slice(0, 100),
          data: { threadId, commentId: comment.id },
        },
      });
    }

    return {
      id: comment.id,
      parentId: data.parentId ?? null,
      depth,
      body: comment.body,
      author: toAuthor(comment.author),
      voteScore: 0,
      userVote: 0,
      isDeleted: false,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  async updateComment(commentId: string, userId: string, body: string): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, isDeleted: true },
    });
    if (!comment) throw new Error("Not found");
    if (comment.authorId !== userId) throw new Error("Forbidden");
    if (comment.isDeleted) throw new Error("Deleted");

    await prisma.comment.update({
      where: { id: commentId },
      data: { body },
    });
  }

  async softDeleteComment(commentId: string, userId: string, isAdmin: boolean): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, threadId: true },
    });
    if (!comment) throw new Error("Not found");
    if (comment.authorId !== userId && !isAdmin) throw new Error("Forbidden");

    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true, body: "[deleted]" },
    });
  }

  // ── Voting ──────────────────────────────────────────────────────────────────

  async voteThread(threadId: string, userId: string, value: number): Promise<{ voteScore: number }> {
    const existing = await prisma.threadVote.findUnique({
      where: { threadId_userId: { threadId, userId } },
    });

    if (existing) {
      if (existing.value === value) {
        // Remove vote
        await prisma.threadVote.delete({ where: { id: existing.id } });
        const thread = await prisma.thread.update({
          where: { id: threadId },
          data: { voteScore: { decrement: value } },
          select: { voteScore: true },
        });
        return { voteScore: thread.voteScore };
      }
      // Flip vote
      await prisma.threadVote.update({ where: { id: existing.id }, data: { value } });
      const thread = await prisma.thread.update({
        where: { id: threadId },
        data: { voteScore: { increment: value - existing.value } },
        select: { voteScore: true },
      });
      return { voteScore: thread.voteScore };
    }

    // New vote
    await prisma.threadVote.create({ data: { threadId, userId, value } });
    const thread = await prisma.thread.update({
      where: { id: threadId },
      data: { voteScore: { increment: value } },
      select: { voteScore: true },
    });
    return { voteScore: thread.voteScore };
  }

  async voteComment(commentId: string, userId: string, value: number): Promise<{ voteScore: number }> {
    const existing = await prisma.commentVote.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      if (existing.value === value) {
        await prisma.commentVote.delete({ where: { id: existing.id } });
        const comment = await prisma.comment.update({
          where: { id: commentId },
          data: { voteScore: { decrement: value } },
          select: { voteScore: true },
        });
        return { voteScore: comment.voteScore };
      }
      await prisma.commentVote.update({ where: { id: existing.id }, data: { value } });
      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: { voteScore: { increment: value - existing.value } },
        select: { voteScore: true },
      });
      return { voteScore: comment.voteScore };
    }

    await prisma.commentVote.create({ data: { commentId, userId, value } });
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { voteScore: { increment: value } },
      select: { voteScore: true },
    });
    return { voteScore: comment.voteScore };
  }

  // ── Views ───────────────────────────────────────────────────────────────────

  async incrementViewCount(threadId: string): Promise<void> {
    await prisma.thread.update({
      where: { id: threadId },
      data: { viewCount: { increment: 1 } },
    });
  }

  // ── Lesson discussion helper ────────────────────────────────────────────────

  async getOrCreateLessonThread(lessonId: string, courseId: string, authorId: string): Promise<string> {
    const existing = await prisma.thread.findFirst({
      where: { scope: "lesson", lessonId },
      select: { id: true },
    });
    if (existing) return existing.id;

    const thread = await prisma.thread.create({
      data: {
        title: "Lesson Discussion",
        body: "",
        preview: "",
        scope: "lesson",
        lessonId,
        courseId,
        authorId,
      },
      select: { id: true },
    });
    return thread.id;
  }
}
