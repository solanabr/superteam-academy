/**
 * @fileoverview Lesson completion route handler.
 * Marks a lesson as complete on-chain and rewards the learner with XP tokens.
 */

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getBackendSigner } from "@/lib/utils/backend-signer";
import { v4 as uuidv4 } from "uuid";
import {
	CLUSTER_URL,
	getAchievementReceiptPda,
	getAchievementTypePda,
	getConfigPda,
	getCoursePda,
	getEnrollmentPda,
	getMinterRolePda,
	TOKEN_2022_PROGRAM_ID,
} from "@/lib/anchor/client";
import { OnchainAcademy } from "@/lib/anchor/idl/onchain_academy";
import IDL from "@/lib/anchor/idl/onchain_academy.json";
import { TRACK_COLLECTIONS, TrackId } from "@/lib/constants/leaderboard";
import { db } from "@/lib/db";
import {
	streak as streakTable,
	userActivity,
	user as userTable,
} from "@/lib/db/schema";
import { getPostHogClient } from "@/lib/posthog-server";

// Recreate connection instance for the server-side
const connection = new Connection(CLUSTER_URL, "confirmed");

/**
 * Award an achievement on-chain via the Anchor program.
 */
async function awardOnchainAchievement(
	program: Program<OnchainAcademy>,
	backendSigner: Keypair,
	recipient: PublicKey,
	achievementId: string,
) {
	try {
		const [configPda] = getConfigPda();
		const [achievementTypePda] = getAchievementTypePda(achievementId);
		const [receiptPda] = getAchievementReceiptPda(achievementId, recipient);
		const [minterRolePda] = getMinterRolePda(backendSigner.publicKey);

		// Fetch achievement type to get collection and check active status
		const achTypeAccount =
			await program.account.achievementType.fetch(achievementTypePda);

		const asset = Keypair.generate();
		const XP_MINT = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT!);
		const recipientTokenAccount = getAssociatedTokenAddressSync(
			XP_MINT,
			recipient,
			false,
			TOKEN_2022_PROGRAM_ID,
		);

		await program.methods
			.awardAchievement()
			.accountsPartial({
				config: configPda,
				achievementType: achievementTypePda,
				achievementReceipt: receiptPda,
				minterRole: minterRolePda,
				asset: asset.publicKey,
				collection: achTypeAccount.collection,
				recipient: recipient,
				recipientTokenAccount: recipientTokenAccount,
				xpMint: XP_MINT,
				payer: backendSigner.publicKey,
				minter: backendSigner.publicKey,
				mplCoreProgram: new PublicKey(
					"CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
				),
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			})
			.signers([backendSigner, asset])
			.rpc();

		console.log(`Successfully awarded on-chain achievement: ${achievementId}`);
		return true;
	} catch (error) {
		console.error(
			`Failed to award on-chain achievement ${achievementId}:`,
			error,
		);
		return false;
	}
}

/**
 * Handles the completion of a lesson for a learner.
 * Verifies lesson progress on-chain and mints XP tokens as a reward.
 */
export async function POST(request: Request) {
	let lessonIndex: number | undefined;
	try {
		const body = (await request.json()) as {
			courseSlug: string;
			learnerAddress: string;
			lessonIndex: number;
		};
		const { courseSlug, learnerAddress } = body;
		lessonIndex = body.lessonIndex;

		// Validate inputs
		if (!courseSlug || !learnerAddress || typeof lessonIndex !== "number") {
			return NextResponse.json(
				{
					error:
						"Missing required parameters: courseSlug, learnerAddress, lessonIndex",
				},
				{ status: 400 },
			);
		}

		const learnerPublicKey = new PublicKey(learnerAddress);

		// 1. Load Backend Signer (Authority keypair)
		let backendSigner: Keypair;
		try {
			backendSigner = getBackendSigner();
		} catch (error) {
			return NextResponse.json(
				{
					error:
						error instanceof Error
							? error.message
							: "Failed to load backend signer.",
				},
				{ status: 500 },
			);
		}

		// 2. Initialize Program Instance Server-Side
		const anchorWallet = {
			publicKey: backendSigner.publicKey,
			signTransaction: async <
				T extends
					| import("@solana/web3.js").Transaction
					| import("@solana/web3.js").VersionedTransaction,
			>(
				tx: T,
			) => {
				if ("version" in tx) {
					tx.sign([backendSigner]);
				} else {
					tx.partialSign(backendSigner);
				}
				return tx;
			},
			signAllTransactions: async <
				T extends
					| import("@solana/web3.js").Transaction
					| import("@solana/web3.js").VersionedTransaction,
			>(
				txs: T[],
			) => {
				return txs.map((tx) => {
					if ("version" in tx) {
						tx.sign([backendSigner]);
					} else {
						tx.partialSign(backendSigner);
					}
					return tx;
				});
			},
		};
		const provider = new AnchorProvider(
			connection,
			anchorWallet,
			AnchorProvider.defaultOptions(),
		);
		const program = new Program<OnchainAcademy>(
			IDL as OnchainAcademy,
			provider,
		);

		// 3. Derive PDAs
		const [configPda] = getConfigPda();
		const [coursePda] = getCoursePda(courseSlug);
		const [enrollmentPda] = getEnrollmentPda(courseSlug, learnerPublicKey);

		// Fetch course account to get XP rewards
		const courseAccount = await program.account.course.fetch(coursePda);
		const XP_MINT = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT!);
		const learnerTokenAccount = getAssociatedTokenAddressSync(
			XP_MINT,
			learnerPublicKey,
			false,
			TOKEN_2022_PROGRAM_ID,
		);

		// 4. Check if ATA exists, if not, create it
		const ataInfo = await connection.getAccountInfo(learnerTokenAccount);
		const instructions = [];
		if (!ataInfo) {
			instructions.push(
				createAssociatedTokenAccountInstruction(
					backendSigner.publicKey,
					learnerTokenAccount,
					learnerPublicKey,
					XP_MINT,
					TOKEN_2022_PROGRAM_ID,
				),
			);
		}

		// 5. Send the Transaction
		const tx = await program.methods
			.completeLesson(lessonIndex)
			.accountsPartial({
				config: configPda,
				course: coursePda,
				enrollment: enrollmentPda,
				learner: learnerPublicKey,
				learnerTokenAccount: learnerTokenAccount,
				xpMint: XP_MINT,
				backendSigner: backendSigner.publicKey,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
			})
			.preInstructions(instructions)
			.signers([backendSigner])
			.rpc();

		// Track lesson completion server-side
		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: learnerAddress,
			event: "lesson_completed",
			properties: {
				course_slug: courseSlug,
				lesson_index: lessonIndex,
				transaction_signature: tx,
			},
		});
		await posthog.shutdown();

		// 6. DB Updates (Streaks & Activity)
		try {
			let bonusXp = 0;
			let isFirstCompletion = false;
			const now = new Date();
			const startOfDay = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
			);

			// Check for first completion of the day
			const [todayActivity] = await db
				.select()
				.from(userActivity)
				.where(
					and(
						eq(userActivity.userId, learnerAddress),
						eq(userActivity.type, "lesson_completed"),
						gte(userActivity.createdAt, startOfDay),
					),
				)
				.limit(1);

			if (!todayActivity) {
				isFirstCompletion = true;
				bonusXp += 25;
			}

			const [existingStreak] = await db
				.select()
				.from(streakTable)
				.where(eq(streakTable.userId, learnerAddress));

			let currentStreakCount = 1;
			if (!existingStreak) {
				await db.insert(streakTable).values({
					id: uuidv4(),
					userId: learnerAddress,
					currentStreak: 1,
					longestStreak: 1,
					lastActiveDate: now,
					updatedAt: now,
				});
			} else {
				const lastActive = existingStreak.lastActiveDate;
				currentStreakCount = existingStreak.currentStreak;
				const isSameDay =
					lastActive && lastActive.toDateString() === now.toDateString();
				const isNextDay =
					lastActive &&
					new Date(lastActive.getTime() + 86400000).toDateString() ===
						now.toDateString();

				if (!isSameDay) {
					if (isNextDay) {
						currentStreakCount += 1;
					} else {
						currentStreakCount = 1;
					}
					await db
						.update(streakTable)
						.set({
							currentStreak: currentStreakCount,
							longestStreak: Math.max(
								currentStreakCount,
								existingStreak.longestStreak,
							),
							lastActiveDate: now,
							updatedAt: now,
						})
						.where(eq(streakTable.userId, learnerAddress));
				}
				bonusXp += 10;
			}

			// Milestone Rewards (Streak-based)
			const milestones = [
				{ days: 7, id: "week-warrior" },
				{ days: 30, id: "monthly-master" },
				{ days: 100, id: "consistency-king" },
			];

			for (const m of milestones) {
				if (currentStreakCount === m.days) {
					const [hasAchievement] = await db
						.select()
						.from(userActivity)
						.where(
							and(
								eq(userActivity.userId, learnerAddress),
								eq(userActivity.type, "achievement"),
								sql`${userActivity.metadata}->>'achievementId' = ${m.id}`,
							),
						);

					if (!hasAchievement) {
						// Record in DB
						await db.insert(userActivity).values({
							id: uuidv4(),
							userId: learnerAddress,
							type: "achievement",
							title: `MILESTONE: ${m.days} DAY STREAK`,
							description: `You've maintained a streak for ${m.days} days!`,
							metadata: { achievementId: m.id },
							createdAt: now,
						});

						// Award On-chain
						await awardOnchainAchievement(
							program,
							backendSigner,
							learnerPublicKey,
							m.id,
						);
					}
				}
			}

			// Progress Rewards: First Steps
			const [allCompletions] = await db
				.select({ count: sql<number>`count(*)` })
				.from(userActivity)
				.where(
					and(
						eq(userActivity.userId, learnerAddress),
						eq(userActivity.type, "lesson_completed"),
					),
				);

			if (Number(allCompletions?.count) === 0) {
				// This is the first one being added now
				await db.insert(userActivity).values({
					id: uuidv4(),
					userId: learnerAddress,
					type: "achievement",
					title: "ACHIEVEMENT: FIRST STEPS",
					description: "You've completed your very first lesson!",
					metadata: { achievementId: "first-steps" },
					createdAt: now,
				});
				await awardOnchainAchievement(
					program,
					backendSigner,
					learnerPublicKey,
					"first-steps",
				);
			}

			// Progress Rewards: Speed Runner
			const [todayCompletions] = await db
				.select({ count: sql<number>`count(*)` })
				.from(userActivity)
				.where(
					and(
						eq(userActivity.userId, learnerAddress),
						eq(userActivity.type, "lesson_completed"),
						gte(userActivity.createdAt, startOfDay),
					),
				);

			if (Number(todayCompletions?.count) === 4) {
				// Will be 5 after this insert
				const [hasSpeedRunner] = await db
					.select()
					.from(userActivity)
					.where(
						and(
							eq(userActivity.userId, learnerAddress),
							eq(userActivity.type, "achievement"),
							sql`${userActivity.metadata}->>'achievementId' = 'speed-runner'`,
						),
					);

				if (!hasSpeedRunner) {
					await db.insert(userActivity).values({
						id: uuidv4(),
						userId: learnerAddress,
						type: "achievement",
						title: "ACHIEVEMENT: SPEED RUNNER",
						description: "Completed 5 lessons in a single day!",
						metadata: { achievementId: "speed-runner" },
						createdAt: now,
					});
					await awardOnchainAchievement(
						program,
						backendSigner,
						learnerPublicKey,
						"speed-runner",
					);
				}
			}

			const trackAddress =
				TRACK_COLLECTIONS[courseAccount.trackId as TrackId] || "general";
			const baseXp = courseAccount.xpPerLesson || 0;
			const totalEarnedXp = baseXp + bonusXp;

			await db.insert(userActivity).values({
				id: uuidv4(),
				userId: learnerAddress,
				type: "lesson_completed",
				title: `Completed Lesson: ${courseSlug.toUpperCase()} #${lessonIndex}`,
				description: isFirstCompletion
					? "First of day bonus (+25)!"
					: "Daily streak bonus (+10)!",
				xpEarned: totalEarnedXp,
				courseId: courseSlug,
				track: trackAddress,
				metadata: {
					courseSlug,
					lessonIndex,
					signature: tx,
					isFirstCompletion,
					bonusXp,
				},
				createdAt: now,
			});

			await db
				.update(userTable)
				.set({
					totalXp: sql`${userTable.totalXp} + ${totalEarnedXp}`,
					level: sql`floor(sqrt((${userTable.totalXp} + ${totalEarnedXp}) / 100))`,
				})
				.where(eq(userTable.id, learnerAddress));
		} catch (dbError) {
			console.error("Failed to update DB gamification stats:", dbError);
		}

		return NextResponse.json({
			success: true,
			signature: tx,
			message: `Lesson ${lessonIndex} marked complete.`,
		});
	} catch (error: unknown) {
		console.error("Error completing lesson:", error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes("LessonAlreadyCompleted")) {
			return NextResponse.json({
				success: true,
				message: `Lesson ${lessonIndex} already complete.`,
			});
		}
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
