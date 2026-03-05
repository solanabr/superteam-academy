/**
 * @fileoverview Server actions for managing per-lesson progress and code persistence.
 */
"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonProgress } from "@/lib/db/schema";

/**
 * Upserts the code for a specific lesson for the current user.
 */
export async function saveLessonCode({
	courseId,
	lessonId,
	code,
	completed = false,
}: {
	courseId: string;
	lessonId: string;
	code: string;
	completed?: boolean;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { error: "Unauthorized" };
	}

	const userId = session.user.id;

	try {
		await db
			.insert(lessonProgress)
			.values({
				id: uuidv4(),
				userId,
				courseId,
				lessonId,
				code,
				completed,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [lessonProgress.userId, lessonProgress.lessonId],
				set: {
					code,
					completed,
					updatedAt: new Date(),
				},
			});

		return { success: true };
	} catch (error) {
		console.error("Failed to save lesson code:", error);
		return { error: "Database error" };
	}
}

/**
 * Retrieves the saved code for a specific lesson for the current user.
 */
export async function getLessonCode(lessonId: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return null;
	}

	const userId = session.user.id;

	try {
		const progress = await db.query.lessonProgress.findFirst({
			where: and(
				eq(lessonProgress.userId, userId),
				eq(lessonProgress.lessonId, lessonId),
			),
		});

		return progress || null;
	} catch (error) {
		console.error("Failed to fetch lesson code:", error);
		return null;
	}
}
