/**
 * @fileoverview Server actions for user gamification, including achievements, skill radar, and course progress.
 */
"use server";

import { BN } from "@coral-xyz/anchor";
import * as Sentry from "@sentry/nextjs";
import { PublicKey } from "@solana/web3.js";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

import { getProgram } from "@/lib/anchor/client";
import {
	calculateLevel,
	getUserEnrollments,
	getXpBalance,
} from "@/lib/anchor/services";
import { auth } from "@/lib/auth";
import { Achievement, achievementDefinitions } from "@/lib/data/achievements";
import {
	UserStats as CourseUserStats,
	LastAccessedCourse,
} from "@/lib/data/courses";
import { SkillRadar } from "@/lib/data/credentials";
import { CourseProgress } from "@/lib/data/user";
import { db } from "@/lib/db";
import { courseProgress, userActivity } from "@/lib/db/schema";
import { getPostHogClient } from "@/lib/posthog-server";
import { client as sanityClient } from "@/sanity/client";

/**
 * Fetches real achievements unlocked by a user from the activity feed.
 * @param userId - Optional ID of the user to fetch achievements for. Falls back to current session.
 */
export async function getUserRealAchievements(userId?: string) {
	let targetUserId = userId;

	if (!targetUserId) {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		targetUserId = session?.user?.id;
	}

	if (!targetUserId) return [];

	const activities = await db.query.userActivity.findMany({
		where: and(
			eq(userActivity.userId, targetUserId),
			eq(userActivity.type, "achievement"),
		),
		orderBy: [desc(userActivity.createdAt)],
	});

	// Map DB activities to Achievement objects
	return activities.map((act) => {
		const metadata = act.metadata as { achievementId?: string };
		const def = achievementDefinitions.find(
			(a) => a.id === metadata.achievementId,
		);

		return {
			id: act.id,
			name: def?.name || act.title.replace("ACHIEVEMENT UNLOCKED: ", ""),
			description: def?.description || act.description || "",
			icon: def?.icon || "bi-patch-check",
			category: def?.category || "special",
			unlockedAt: act.createdAt.toISOString(),
		} as Achievement;
	});
}

/**
 * Calculates real Skill Radar scores based on XP earned in different course categories.
 * @param userId - Optional ID of the user to calculate radar for.
 */
export async function calculateRealSkillRadar(
	userId?: string,
): Promise<SkillRadar> {
	let targetUserId = userId;

	if (!targetUserId) {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		targetUserId = session?.user?.id;
	}

	const skills: SkillRadar = {
		rust: 0,
		anchor: 0,
		frontend: 0,
		security: 0,
		governance: 0,
	};

	if (!targetUserId) return skills;

	const activities = await db.query.userActivity.findMany({
		where: and(
			eq(userActivity.userId, targetUserId),
			eq(userActivity.type, "lesson_completed"),
		),
	});

	// Fetch all course metadata for mapping
	const sanityCourses = await sanityClient.fetch<
		{ slug: string; category: string }[]
	>(`*[_type == "course"] { "slug": slug.current, category }`);

	// Simple heuristic: Map course categories to skill buckets
	activities.forEach((act) => {
		const metadata = act.metadata as { courseSlug?: string };
		const course = sanityCourses.find((c) => c.slug === metadata.courseSlug);
		const xp = act.xpEarned || 0;

		if (!course) return;

		switch (course.category?.toLowerCase()) {
			case "rust":
				skills.rust += xp;
				break;
			case "core":
			case "anchor":
			case "spl":
				skills.anchor += xp;
				break;
			case "web3":
			case "frontend":
				skills.frontend += xp;
				break;
			case "security":
				skills.security += xp;
				break;
			case "governance":
				skills.governance += xp;
				break;
		}
	});

	// Normalize to 0-100 scale (assuming 1000 XP in a category is "pro" for the radar)
	return {
		rust: Math.min(100, Math.floor(skills.rust / 10)),
		anchor: Math.min(100, Math.floor(skills.anchor / 10)),
		frontend: Math.min(100, Math.floor(skills.frontend / 10)),
		security: Math.min(100, Math.floor(skills.security / 10)),
		governance: Math.min(100, Math.floor(skills.governance / 10)),
	};
}

/**
 * Fetches real course progress from the database.
 * @param userId - Optional ID of the user to fetch progress for.
 */
export async function getEnrolledCoursesProgress(
	userId?: string,
): Promise<CourseProgress[]> {
	let targetUserId = userId;

	if (!targetUserId) {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		targetUserId = session?.user?.id;
	}

	if (!targetUserId) return [];

	const activities = await db.query.userActivity.findMany({
		where: eq(userActivity.userId, targetUserId),
	});

	// Group by course and count lessons
	const courseMap = new Map<string, { lessons: Set<number>; xp: number }>();

	activities.forEach((act) => {
		if (
			act.type !== "lesson_completed" &&
			act.type !== "enrolled" &&
			act.type !== "course_completed"
		)
			return;

		const metadata = act.metadata as {
			courseSlug?: string;
			courseId?: string;
			lessonIndex?: number;
		} | null;

		const courseId = act.courseId || metadata?.courseSlug || metadata?.courseId;

		if (!courseId) return;

		const existing = courseMap.get(courseId) || {
			lessons: new Set<number>(),
			xp: 0,
		};
		if (metadata?.lessonIndex !== undefined) {
			existing.lessons.add(metadata.lessonIndex);
		}
		existing.xp += act.xpEarned || 0;
		courseMap.set(courseId, existing);
	});

	// Fetch metadata for titles and lesson counts
	const sanityCourses = await sanityClient.fetch<
		{ slug: string; title: string; totalLessons: number }[]
	>(
		`*[_type == "course"] { "slug": slug.current, title, "totalLessons": count(modules[].lessons[]) }`,
	);

	return Array.from(courseMap.entries()).map(([slug, data]) => {
		const courseDef = sanityCourses.find((c) => c.slug === slug);
		const totalLessons = courseDef?.totalLessons || 5; // Fallback
		const progress = Math.min(
			100,
			data.lessons.size > 0
				? Math.round((data.lessons.size / totalLessons) * 100)
				: 0,
		);

		return {
			courseId: slug,
			courseCode: slug.toUpperCase(),
			courseTitle: courseDef?.title || slug.toUpperCase(),
			progress,
			completed: progress === 100,
		};
	});
}

/**
 * Fetches all necessary data for the courses page dashboard (right panel).
 * Includes stats and the last accessed course details.
 */
export async function getCoursesDashboardData(): Promise<{
	stats: CourseUserStats;
	lastAccessed: LastAccessedCourse | null;
}> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return {
			stats: {
				totalXP: 0,
				coursesActive: 0,
				completionRate: 0,
				certificates: 0,
				currentStreak: 0,
				level: 1,
			},
			lastAccessed: null,
		};
	}

	const userId = session.user.id;
	const walletAddress = session.user.walletAddress;

	// 0. Proactively sync enrollments if wallet is present
	if (walletAddress) {
		try {
			await syncUserEnrollments(userId, walletAddress);
		} catch (e) {
			console.warn("Failed to sync enrollments in dashboard:", e);
		}
	}

	// 1. Fetch Stats in parallel
	const [xp, progress, activities, dbProgress] = await Promise.all([
		walletAddress
			? getXpBalance(new PublicKey(walletAddress))
			: Promise.resolve(0),
		getEnrolledCoursesProgress(userId),
		db.query.userActivity.findMany({
			where: eq(userActivity.userId, userId),
			orderBy: [desc(userActivity.createdAt)],
		}),
		db.query.courseProgress.findMany({
			where: eq(courseProgress.userId, userId),
			orderBy: [desc(courseProgress.lastAccessedAt)],
		}),
	]);

	const activeCourses = progress.filter(
		(p) => !p.completed && p.progress > 0,
	).length;
	const completedCourses = progress.filter((p) => p.completed).length;
	const certificates = activities.filter(
		(a) => a.type === "course_completed",
	).length;
	const completionRate =
		progress.length > 0
			? Math.round((completedCourses / progress.length) * 100)
			: 0;
	const level = calculateLevel(xp);

	// 2. Determine Last Accessed Course (from dedicated table first)
	const latestEntry = dbProgress[0];
	let lastAccessed: LastAccessedCourse | null = null;

	if (latestEntry) {
		const slug = latestEntry.courseId;
		if (slug) {
			const courseProgress = progress.find((p) => p.courseId === slug);

			// Fetch course details from Sanity or fallback to mock
			let courseTitle = slug.toUpperCase();
			let sanityCourse: {
				title: string;
				modules: { lessons: { title: string }[] }[];
			} | null = null;

			try {
				sanityCourse = await sanityClient.fetch(
					`*[_type == "course" && slug.current == $slug][0] { title, modules[]-> { lessons[]-> { title } } }`,
					{ slug },
				);
				courseTitle = sanityCourse?.title || courseTitle;
			} catch {
				console.warn("Sanity fetch failed for last accessed course:", slug);
			}

			if (!sanityCourse) {
				courseTitle = slug.toUpperCase();
			}

			// Format lessons for the UI
			const lessons = (sanityCourse?.modules?.[0]?.lessons || [])
				.slice(0, 3)
				.map((l: { title: string }) => ({
					title: l.title,
					completed: false, // In a real app, we'd check on-chain or activity feed deeper
				}));

			lastAccessed = {
				courseId: slug,
				title: courseTitle,
				progress: courseProgress?.progress || 0,
				lessons:
					lessons.length > 0
						? lessons
						: [{ title: "CONTINUE LEARNING", completed: false }],
			};
		}
	}

	return {
		stats: {
			totalXP: xp,
			coursesActive: activeCourses,
			completionRate,
			certificates,
			currentStreak: 0, // Streak tracking would need the streak table query
			level,
		},
		lastAccessed,
	};
}

/**
 * Records a course enrollment in the database activity feed.
 */
export async function recordEnrollment(courseSlug: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) return { error: "Unauthorized" };

	// Fetch title from Sanity for the record
	const course = await sanityClient.fetch<{ title: string }>(
		`*[_type == "course" && slug.current == $courseSlug][0] { title }`,
		{ courseSlug },
	);

	try {
		const activityId = uuidv4();
		await db.transaction(async (tx) => {
			await tx.insert(userActivity).values({
				id: activityId,
				userId: session.user.id,
				type: "enrolled",
				title: `ENROLLED: ${course?.title || courseSlug.toUpperCase()}`,
				description: `Operator joined the ${course?.title || courseSlug.toUpperCase()} program.`,
				courseId: courseSlug,
				metadata: { courseSlug },
			});

			await tx
				.insert(courseProgress)
				.values({
					id: uuidv4(),
					userId: session.user.id,
					courseId: courseSlug,
					progress: 0,
					lastAccessedAt: new Date(),
					updatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [courseProgress.userId, courseProgress.courseId],
					set: { lastAccessedAt: new Date(), updatedAt: new Date() },
				});
		});

		// Track enrollment server-side
		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: session.user.id,
			event: "course_enrolled",
			properties: {
				course_slug: courseSlug,
				course_title: course?.title || courseSlug.toUpperCase(),
			},
		});
		await posthog.shutdown();

		return { success: true };
	} catch (error) {
		console.error("Failed to record enrollment:", error);
		Sentry.captureException(error, {
			extra: { courseSlug },
		});
		return { error: "Database error" };
	}
}

/**
 * Synchronizes user's on-chain enrollments with the database activity feed.
 */
export async function syncUserEnrollments(
	userId: string,
	walletAddress: string,
) {
	if (!userId || !walletAddress) return;

	try {
		const program = getProgram();
		const learnerPubkey = new PublicKey(walletAddress);
		const onchainEnrollments = await getUserEnrollments(program, learnerPubkey);

		if (onchainEnrollments.length === 0) return;

		// Fetch existing 'enrolled' activities
		const existingActivities = await db.query.userActivity.findMany({
			where: and(
				eq(userActivity.userId, userId),
				eq(userActivity.type, "enrolled"),
			),
		});

		const existingSlugs = new Set(
			existingActivities.map(
				(a) => (a.metadata as { courseSlug?: string })?.courseSlug,
			),
		);

		// 2. Fetch missing kurs metadata efficiently
		const courseSlugsToSync = onchainEnrollments
			.map((e) => e.courseId)
			.filter(Boolean) as string[];
		const sanityMetadata = await sanityClient.fetch<
			{
				slug: string;
				title: string;
				totalLessons: number;
				xp_per_lesson: number;
			}[]
		>(
			`*[_type == "course" && slug.current in $slugs] { "slug": slug.current, title, "totalLessons": count(modules[].lessons[]), xp_per_lesson }`,
			{ slugs: courseSlugsToSync },
		);

		// Insert missing ones
		for (const enroll of onchainEnrollments) {
			const slug = enroll.courseId;
			if (!slug) continue;

			const courseDef = sanityMetadata.find((c) => c.slug === slug);

			// 1. Sync Enrollment Activity
			if (!existingSlugs.has(slug)) {
				await db.insert(userActivity).values({
					id: uuidv4(),
					userId,
					type: "enrolled",
					title: `ENROLLED: ${courseDef?.title || slug.toUpperCase()}`,
					description: `Operator joined the ${courseDef?.title || slug.toUpperCase()} program.`,
					courseId: slug,
					metadata: { courseSlug: slug },
				});
			}

			// 2. Sync Lesson Completions & Course Progress
			const lessonFlags = enroll.account.lessonFlags as BN[];
			const lessonCount = courseDef?.totalLessons || 10;
			const isCourseCompletedOnChain = !!enroll.account.completedAt;

			// Fetch existing 'lesson_completed' for this course
			const existingLessons = await db.query.userActivity.findMany({
				where: and(
					eq(userActivity.userId, userId),
					eq(userActivity.type, "lesson_completed"),
					eq(userActivity.courseId, slug),
				),
			});

			const completedIndices = new Set(
				existingLessons.map(
					(a) => (a.metadata as { lessonIndex?: number })?.lessonIndex,
				),
			);

			let maxLessonIndex = -1;

			for (let i = 0; i < lessonCount; i++) {
				const wordIndex = Math.floor(i / 64);
				const bitIndex = i % 64;
				const isDoneOnChain = !lessonFlags[wordIndex]
					.and(new BN(1).shln(bitIndex))
					.isZero();

				if (isDoneOnChain) {
					maxLessonIndex = Math.max(maxLessonIndex, i);
					if (!completedIndices.has(i)) {
						completedIndices.add(i); // Update in-memory set
						await db.insert(userActivity).values({
							id: uuidv4(),
							userId,
							type: "lesson_completed",
							title: `Completed Lesson: ${slug.toUpperCase()} #${i}`,
							description: `Successfully completed on-chain lesson tasks (Synced).`,
							xpEarned: courseDef?.xp_per_lesson || 100,
							courseId: slug,
							metadata: { courseSlug: slug, lessonIndex: i },
						});
					}
				}
			}

			// If the course is completed on-chain but not in our activity feed, record it
			const existingCompletion = await db.query.userActivity.findFirst({
				where: and(
					eq(userActivity.userId, userId),
					eq(userActivity.type, "course_completed"),
					eq(userActivity.courseId, slug),
				),
			});

			if (isCourseCompletedOnChain && !existingCompletion) {
				await db.insert(userActivity).values({
					id: uuidv4(),
					userId,
					type: "course_completed",
					title: `COURSE COMPLETED: ${slug.toUpperCase()}`,
					description:
						"Mastered the track and earned a completion bonus! (Synced)",
					xpEarned: Math.floor(
						(lessonCount * (courseDef?.xp_per_lesson || 100)) / 2,
					),
					courseId: slug,
					metadata: { courseSlug: slug },
				});
			}

			// Update Course Progress Table
			const newProgress = isCourseCompletedOnChain
				? 100
				: lessonCount > 0
					? Math.round((completedIndices.size / lessonCount) * 100)
					: 0;

			const existingProgress = await db.query.courseProgress.findFirst({
				where: and(
					eq(courseProgress.userId, userId),
					eq(courseProgress.courseId, slug),
				),
			});

			if (existingProgress) {
				await db
					.update(courseProgress)
					.set({
						progress: newProgress,
						currentLessonIndex:
							maxLessonIndex >= 0
								? maxLessonIndex
								: existingProgress.currentLessonIndex,
						lastAccessedAt: new Date(),
						updatedAt: new Date(),
						completedAt: isCourseCompletedOnChain
							? existingProgress.completedAt || new Date()
							: null,
					})
					.where(eq(courseProgress.id, existingProgress.id));
			} else {
				await db.insert(courseProgress).values({
					id: uuidv4(),
					userId,
					courseId: slug,
					progress: newProgress,
					currentLessonIndex: maxLessonIndex >= 0 ? maxLessonIndex : 0,
					lastAccessedAt: new Date(),
					updatedAt: new Date(),
					completedAt: isCourseCompletedOnChain ? new Date() : null,
				});
			}
		}
	} catch (error) {
		console.error(`Failed to sync enrollments for user ${userId}:`, error);
		Sentry.captureException(error, {
			extra: { userId, walletAddress },
		});
	}
}
