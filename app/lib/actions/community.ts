"use server";

import { db } from "@/lib/db";
import { thread, threadComment, user } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getThreads(category?: string) {
	const query = db
		.select({
			id: thread.id,
			slug: thread.slug,
			title: thread.title,
			content: thread.content,
			category: thread.category,
			replies: thread.replies,
			views: thread.views,
			likes: thread.likes,
			lastActiveAt: thread.lastActiveAt,
			createdAt: thread.createdAt,
			authorId: thread.authorId,
			authorName: user.name,
			authorImage: user.image,
			authorAvatar: user.avatarSeed,
		})
		.from(thread)
		.leftJoin(user, eq(thread.authorId, user.id));

	if (category) {
		query.where(eq(thread.category, category));
	}

	const results = await query.orderBy(desc(thread.lastActiveAt)).limit(20);

	return results;
}

export async function getThreadBySlug(slug: string) {
	const [threadData] = await db
		.select({
			id: thread.id,
			slug: thread.slug,
			title: thread.title,
			content: thread.content,
			category: thread.category,
			replies: thread.replies,
			views: thread.views,
			likes: thread.likes,
			lastActiveAt: thread.lastActiveAt,
			createdAt: thread.createdAt,
			authorId: thread.authorId,
			authorName: user.name,
			authorImage: user.image,
			authorAvatar: user.avatarSeed,
		})
		.from(thread)
		.leftJoin(user, eq(thread.authorId, user.id))
		.where(eq(thread.slug, slug))
		.limit(1);

	if (!threadData) {
		return null;
	}

	// Fetch comments
	const commentsData = await db
		.select({
			id: threadComment.id,
			content: threadComment.content,
			likes: threadComment.likes,
			createdAt: threadComment.createdAt,
			authorId: threadComment.authorId,
			authorName: user.name,
			authorImage: user.image,
			authorAvatar: user.avatarSeed,
		})
		.from(threadComment)
		.leftJoin(user, eq(threadComment.authorId, user.id))
		.where(eq(threadComment.threadId, threadData.id))
		.orderBy(threadComment.createdAt);

	return {
		...threadData,
		comments: commentsData,
	};
}

export async function createThread(data: {
	title: string;
	category: string;
	content: string;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	// Generate slug
	const baseSlug = data.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)+/g, "");

	const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
	const id = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

	const [newThread] = await db
		.insert(thread)
		.values({
			id,
			slug,
			title: data.title,
			category: data.category,
			content: data.content,
			authorId: session.user.id,
		})
		.returning();

	revalidatePath("/[locale]/community", "page");
	return newThread;
}

export async function createComment(threadId: string, content: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const id = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

	const [newComment] = await db
		.insert(threadComment)
		.values({
			id,
			threadId,
			content,
			authorId: session.user.id,
		})
		.returning();

	// Update thread replies count and last active
	await db
		.update(thread)
		.set({
			replies: sql`${thread.replies} + 1`,
			lastActiveAt: new Date(),
		})
		.where(eq(thread.id, threadId));

	revalidatePath("/[locale]/community/[slug]", "page");
	return newComment;
}

export async function likeThread(threadId: string) {
	// Basic increment for now. Later can add thread_likes table for uniqueness
	await db
		.update(thread)
		.set({ likes: sql`${thread.likes} + 1` })
		.where(eq(thread.id, threadId));
	revalidatePath("/[locale]/community/[slug]", "page");
}

export async function likeComment(commentId: string) {
	// Basic increment
	await db
		.update(threadComment)
		.set({ likes: sql`${threadComment.likes} + 1` })
		.where(eq(threadComment.id, commentId));
	revalidatePath("/[locale]/community/[slug]", "page");
}
