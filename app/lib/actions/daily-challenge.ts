/**
 * @fileoverview Server actions for standalone challenges (daily + regular).
 * Handles fetching, submission, XP awards, and user history.
 * Fully separate from course/lesson actions.
 */
"use server";

import * as Sentry from "@sentry/nextjs";
import { PublicKey } from "@solana/web3.js";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { mintXp } from "@/lib/anchor/rewards";
import { auth } from "@/lib/auth";
import {
	fetchAllChallenges,
	fetchChallengeBySlug,
	fetchTodaysChallenge,
} from "@/lib/data/daily-challenge";
import { db } from "@/lib/db";
import {
	challengeSubmission,
	dailyChallenge,
	user,
	userActivity,
} from "@/lib/db/schema";
import { getPostHogClient } from "@/lib/posthog-server";

/**
 * Fetches today's daily challenge. Server action callable from client components.
 */
export async function getTodaysChallenge() {
	try {
		return await fetchTodaysChallenge();
	} catch (error) {
		console.error("Failed to fetch today's challenge:", error);
		Sentry.captureException(error);
		return null;
	}
}

/**
 * Fetches all active challenges for the listing page.
 */
export async function getAllChallenges() {
	try {
		return await fetchAllChallenges();
	} catch (error) {
		console.error("Failed to fetch challenges:", error);
		Sentry.captureException(error);
		return [];
	}
}

/**
 * Fetches a single challenge by slug.
 */
export async function getChallenge(slug: string) {
	try {
		return await fetchChallengeBySlug(slug);
	} catch (error) {
		console.error("Failed to fetch challenge:", error);
		Sentry.captureException(error);
		return null;
	}
}

/**
 * Submits a challenge solution, awards XP on success, and records activity.
 * Has unique constraint protection — calling again for the same challenge
 * will update the existing submission without awarding double XP.
 */
export async function submitChallenge({
	challengeSlug,
	code,
	passed,
}: {
	challengeSlug: string;
	code: string;
	passed: boolean;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return { error: "Unauthorized" };
	}

	const userId = session.user.id;

	try {
		// 1. Find or create the daily_challenge DB record
		let dbChallenge = await db.query.dailyChallenge.findFirst({
			where: eq(dailyChallenge.slug, challengeSlug),
		});

		if (!dbChallenge) {
			// Fetch from Sanity and sync to DB
			const sanityChallenge = await fetchChallengeBySlug(challengeSlug);
			if (!sanityChallenge) {
				return { error: "Challenge not found" };
			}

			const newId = uuidv4();
			await db.insert(dailyChallenge).values({
				id: newId,
				sanityId: sanityChallenge._id,
				slug: challengeSlug,
				title: sanityChallenge.title,
				difficulty: sanityChallenge.difficulty,
				category: sanityChallenge.category,
				xpReward: sanityChallenge.xpReward,
				scheduledDate: sanityChallenge.scheduledDate,
				isActive: true,
			});

			dbChallenge = await db.query.dailyChallenge.findFirst({
				where: eq(dailyChallenge.id, newId),
			});
		}

		if (!dbChallenge) {
			return { error: "Failed to resolve challenge" };
		}

		// 2. Check for existing submission
		const existingSubmission = await db.query.challengeSubmission.findFirst({
			where: and(
				eq(challengeSubmission.userId, userId),
				eq(challengeSubmission.challengeId, dbChallenge.id),
			),
		});

		const xpToAward =
			passed && !existingSubmission?.passed ? dbChallenge.xpReward : 0;

		// 3. Upsert submission
		if (existingSubmission) {
			await db
				.update(challengeSubmission)
				.set({
					code,
					passed: passed || existingSubmission.passed, // Once passed, stays passed
					xpEarned: existingSubmission.passed
						? existingSubmission.xpEarned
						: passed
							? dbChallenge.xpReward
							: 0,
					submittedAt: new Date(),
				})
				.where(eq(challengeSubmission.id, existingSubmission.id));
		} else {
			await db.insert(challengeSubmission).values({
				id: uuidv4(),
				userId,
				challengeId: dbChallenge.id,
				code,
				passed,
				xpEarned: passed ? dbChallenge.xpReward : 0,
				submittedAt: new Date(),
			});
		}

		// 4. If first-time pass, award XP via activity feed and update user totalXp
		if (xpToAward > 0) {
			await db.transaction(async (tx) => {
				// Record activity
				await tx.insert(userActivity).values({
					id: uuidv4(),
					userId,
					type: "challenge_completed",
					title: `CHALLENGE COMPLETED: ${dbChallenge.title}`,
					description: `Solved the "${dbChallenge.title}" challenge and earned ${xpToAward} XP.`,
					xpEarned: xpToAward,
					metadata: {
						challengeSlug,
						challengeId: dbChallenge.id,
						isDaily: !!dbChallenge.scheduledDate,
					},
				});

				// Update user's total XP
				const currentUser = await tx.query.user.findFirst({
					where: eq(user.id, userId),
				});
				if (currentUser) {
					const newXp = (currentUser.totalXp || 0) + xpToAward;
					const newLevel = Math.max(1, Math.floor(Math.sqrt(newXp / 100)));
					await tx
						.update(user)
						.set({ totalXp: newXp, level: newLevel })
						.where(eq(user.id, userId));
				}
			});

			// 5. Award On-chain XP Tokens
			try {
				const recipientPubkey = new PublicKey(userId);
				await mintXp(
					recipientPubkey,
					xpToAward,
					`daily_challenge:${challengeSlug}`,
				);
			} catch (onchainError) {
				console.error(
					"Failed to mint on-chain XP for challenge:",
					onchainError,
				);
				// We don't fail the whole action, as DB state is already updated.
				// This can be retried or handled by a background worker later.
			}

			// 6. PostHog analytics (server-side)
			const posthog = getPostHogClient();
			posthog.capture({
				distinctId: userId,
				event: "challenge_completed",
				properties: {
					challenge_slug: challengeSlug,
					challenge_title: dbChallenge.title,
					challenge_category: dbChallenge.category,
					challenge_difficulty: dbChallenge.difficulty,
					xp_earned: xpToAward,
					is_daily: !!dbChallenge.scheduledDate,
				},
			});
			await posthog.shutdown();
		}

		return {
			success: true,
			passed,
			xpEarned: xpToAward,
			alreadyCompleted: existingSubmission?.passed ?? false,
		};
	} catch (error) {
		console.error("Failed to submit challenge:", error);
		Sentry.captureException(error, {
			extra: { challengeSlug, userId },
		});
		return { error: "Failed to submit challenge" };
	}
}

/**
 * Gets the current user's challenge submission history.
 */
export async function getUserChallengeHistory() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) return [];

	try {
		const submissions = await db.query.challengeSubmission.findMany({
			where: eq(challengeSubmission.userId, session.user.id),
			orderBy: [desc(challengeSubmission.submittedAt)],
		});

		// Enrich with challenge slugs
		const challengeIds = [...new Set(submissions.map((s) => s.challengeId))];
		const challenges = await Promise.all(
			challengeIds.map((id) =>
				db.query.dailyChallenge.findFirst({
					where: eq(dailyChallenge.id, id),
				}),
			),
		);

		const challengeMap = new Map(
			challenges.filter(Boolean).map((c) => [c!.id, c!.slug]),
		);

		return submissions.map((s) => ({
			id: s.id,
			challengeId: s.challengeId,
			challengeSlug: challengeMap.get(s.challengeId) || "",
			passed: s.passed,
			xpEarned: s.xpEarned,
			submittedAt: s.submittedAt.toISOString(),
		}));
	} catch (error) {
		console.error("Failed to fetch challenge history:", error);
		Sentry.captureException(error);
		return [];
	}
}
