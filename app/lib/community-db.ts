import "server-only";
import { getCommunityPrisma } from "@/lib/prisma";

export type ThreadType = "discussion" | "question";

export interface CommunityThread {
  id: number;
  type: ThreadType;
  title: string;
  body: string;
  authorName: string;
  walletAddress: string | null;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  hasAcceptedReply: boolean;
}

export interface CommunityReply {
  id: number;
  threadId: number;
  body: string;
  authorName: string;
  walletAddress: string | null;
  isAccepted: boolean;
  createdAt: string;
}

function toNumber(value: bigint | number): number {
  if (typeof value === "number") return value;
  return Number(value);
}

function toIsoString(value: Date): string {
  return value.toISOString();
}

interface ListThreadsParams {
  type?: ThreadType;
  query?: string;
  limit: number;
  offset: number;
}

export async function listThreads(params: ListThreadsParams): Promise<CommunityThread[]> {
  const prisma = getCommunityPrisma();
  const search = params.query?.trim();
  const where = {
    ...(params.type && { type: params.type }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { body: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const rows = await prisma.communityThread.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit,
    skip: params.offset,
    include: {
      _count: { select: { replies: true } },
      replies: {
        where: { isAccepted: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  return rows.map((r) => ({
    id: toNumber(r.id),
    type: r.type as ThreadType,
    title: r.title,
    body: r.body,
    authorName: r.authorName,
    walletAddress: r.walletAddress,
    createdAt: toIsoString(r.createdAt),
    updatedAt: toIsoString(r.updatedAt),
    replyCount: r._count.replies,
    hasAcceptedReply: r.replies.length > 0,
  }));
}

export async function countThreads(type?: ThreadType, query?: string): Promise<number> {
  const prisma = getCommunityPrisma();
  const search = query?.trim();
  const where = {
    ...(type && { type }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { body: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };
  return prisma.communityThread.count({ where });
}

export async function createThread(input: {
  type: ThreadType;
  title: string;
  body: string;
  authorName: string;
  walletAddress: string | null;
}): Promise<CommunityThread> {
  const prisma = getCommunityPrisma();
  const created = await prisma.communityThread.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body,
      authorName: input.authorName,
      walletAddress: input.walletAddress,
    },
  });
  return {
    id: toNumber(created.id),
    type: created.type as ThreadType,
    title: created.title,
    body: created.body,
    authorName: created.authorName,
    walletAddress: created.walletAddress,
    createdAt: toIsoString(created.createdAt),
    updatedAt: toIsoString(created.updatedAt),
    replyCount: 0,
    hasAcceptedReply: false,
  };
}

export async function getThreadById(id: number): Promise<CommunityThread | null> {
  const prisma = getCommunityPrisma();
  const thread = await prisma.communityThread.findUnique({
    where: { id: BigInt(id) },
    include: {
      _count: { select: { replies: true } },
      replies: {
        where: { isAccepted: true },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!thread) return null;
  return {
    id: toNumber(thread.id),
    type: thread.type as ThreadType,
    title: thread.title,
    body: thread.body,
    authorName: thread.authorName,
    walletAddress: thread.walletAddress,
    createdAt: toIsoString(thread.createdAt),
    updatedAt: toIsoString(thread.updatedAt),
    replyCount: thread._count.replies,
    hasAcceptedReply: thread.replies.length > 0,
  };
}

export async function listReplies(threadId: number): Promise<CommunityReply[]> {
  const prisma = getCommunityPrisma();
  const rows = await prisma.communityReply.findMany({
    where: { threadId: BigInt(threadId) },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: toNumber(r.id),
    threadId: toNumber(r.threadId),
    body: r.body,
    authorName: r.authorName,
    walletAddress: r.walletAddress,
    isAccepted: r.isAccepted,
    createdAt: toIsoString(r.createdAt),
  }));
}

export async function createReply(input: {
  threadId: number;
  body: string;
  authorName: string;
  walletAddress: string | null;
}): Promise<CommunityReply> {
  const prisma = getCommunityPrisma();
  const created = await prisma.communityReply.create({
    data: {
      threadId: BigInt(input.threadId),
      body: input.body,
      authorName: input.authorName,
      walletAddress: input.walletAddress,
    },
  });
  return {
    id: toNumber(created.id),
    threadId: toNumber(created.threadId),
    body: created.body,
    authorName: created.authorName,
    walletAddress: created.walletAddress,
    isAccepted: created.isAccepted,
    createdAt: toIsoString(created.createdAt),
  };
}
