/**
 * @fileoverview API route to finalize a course on-chain.
 * Rewards the learner with a completion bonus and triggers creator rewards.
 */

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import * as Sentry from "@sentry/nextjs";
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
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
	courseProgress,
	streak as streakTable,
	userActivity,
} from "@/lib/db/schema";
import { getPostHogClient } from "@/lib/posthog-server";
import { getBackendSigner } from "@/lib/utils/backend-signer";

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
 * Handles the finalization of a course for a learner.
 * Verifies lesson completion and mints bonus XP.
 */
export async function POST(request: Request) {
	let courseSlug = "";
	let learnerAddress = "";

	try {
		const body = (await request.json()) as {
			courseSlug: string;
			learnerAddress: string;
		};
		courseSlug = body.courseSlug;
		learnerAddress = body.learnerAddress;

		if (!courseSlug || !learnerAddress) {
			return NextResponse.json(
				{ error: "Missing courseSlug or learnerAddress" },
				{ status: 400 },
			);
		}

		const learnerPublicKey = new PublicKey(learnerAddress);

		// 1. Load Backend Signer
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

		// 2. Setup Program
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

		// 3. Derive PDAs and Fetch Course Data
		const [configPda] = getConfigPda();
		const [coursePda] = getCoursePda(courseSlug);
		const [enrollmentPda] = getEnrollmentPda(courseSlug, learnerPublicKey);

		// Fetch course account to get creator address
		const courseAccount = await program.account.course.fetch(coursePda);
		const creatorPublicKey = courseAccount.creator;

		// 4. Token Accounts
		const XP_MINT = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT!);

		const learnerTokenAccount = getAssociatedTokenAddressSync(
			XP_MINT,
			learnerPublicKey,
			false,
			TOKEN_2022_PROGRAM_ID,
		);

		const creatorTokenAccount = getAssociatedTokenAddressSync(
			XP_MINT,
			creatorPublicKey,
			false,
			TOKEN_2022_PROGRAM_ID,
		);

		// 5. Ensure Token Accounts exist
		const instructions = [];
		const [learnerAtaInfo, creatorAtaInfo] = await Promise.all([
			connection.getAccountInfo(learnerTokenAccount),
			connection.getAccountInfo(creatorTokenAccount),
		]);

		if (!learnerAtaInfo) {
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

		if (!creatorAtaInfo) {
			instructions.push(
				createAssociatedTokenAccountInstruction(
					backendSigner.publicKey,
					creatorTokenAccount,
					creatorPublicKey,
					XP_MINT,
					TOKEN_2022_PROGRAM_ID,
				),
			);
		}

		// 6. Finalize Course
		const tx = await program.methods
			.finalizeCourse()
			.accountsPartial({
				config: configPda,
				course: coursePda,
				enrollment: enrollmentPda,
				learner: learnerPublicKey,
				learnerTokenAccount,
				creatorTokenAccount,
				creator: creatorPublicKey,
				xpMint: XP_MINT,
				backendSigner: backendSigner.publicKey,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
			})
			.preInstructions(instructions)
			.signers([backendSigner])
			.rpc();

		// Track course completion server-side
		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: learnerAddress,
			event: "course_completed",
			properties: {
				course_slug: courseSlug,
				transaction_signature: tx,
				track_id: courseAccount.trackId,
				lesson_count: courseAccount.lessonCount,
			},
		});
		await posthog.shutdown();

		// 7. DB Updates (Streaks & Activity)
		try {
			const now = new Date();
			const [existingStreak] = await db
				.select()
				.from(streakTable)
				.where(eq(streakTable.userId, learnerAddress));

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
				let newCurrent = existingStreak.currentStreak;
				const isSameDay =
					lastActive && lastActive.toDateString() === now.toDateString();
				const isNextDay =
					lastActive &&
					new Date(lastActive.getTime() + 86400000).toDateString() ===
						now.toDateString();

				if (!isSameDay) {
					if (isNextDay) {
						newCurrent += 1;
					} else {
						newCurrent = 1;
					}
					await db
						.update(streakTable)
						.set({
							currentStreak: newCurrent,
							longestStreak: Math.max(newCurrent, existingStreak.longestStreak),
							lastActiveDate: now,
							updatedAt: now,
						})
						.where(eq(streakTable.userId, learnerAddress));
				}
			}

			// Add Activity record
			const trackAddress =
				TRACK_COLLECTIONS[courseAccount.trackId as TrackId] || "general";

			await db.insert(userActivity).values({
				id: uuidv4(),
				userId: learnerAddress,
				type: "course_completed",
				title: `COURSE COMPLETED: ${courseSlug.toUpperCase()}`,
				description: "Mastered the track and earned a completion bonus!",
				xpEarned: Math.floor(
					(courseAccount.lessonCount * courseAccount.xpPerLesson) / 2,
				),
				courseId: courseSlug,
				track: trackAddress,
				metadata: { courseSlug, signature: tx },
				createdAt: now,
			});

			// 8. Update Course Progress Table
			// Map to correct types for querying
			const { and: andOp, eq: eqOp } = await import("drizzle-orm");
			const existingProgress = await db.query.courseProgress.findFirst({
				where: andOp(
					eqOp(courseProgress.userId, learnerAddress),
					eqOp(courseProgress.courseId, courseSlug),
				),
			});

			if (existingProgress) {
				await db
					.update(courseProgress)
					.set({
						progress: 100,
						completedAt: now,
						lastAccessedAt: now,
						updatedAt: now,
					})
					.where(eqOp(courseProgress.id, existingProgress.id));
			} else {
				await db.insert(courseProgress).values({
					id: uuidv4(),
					userId: learnerAddress,
					courseId: courseSlug,
					progress: 100,
					completedAt: now,
					lastAccessedAt: now,
					updatedAt: now,
				});
			}

			// Achievements: Course Completer (First Course)
			const [totalCompleted] = await db
				.select({ count: sql<number>`count(*)` })
				.from(courseProgress)
				.where(
					andOp(
						eqOp(courseProgress.userId, learnerAddress),
						eqOp(courseProgress.progress, 100),
					),
				);

			if (Number(totalCompleted?.count) === 1) {
				await db.insert(userActivity).values({
					id: uuidv4(),
					userId: learnerAddress,
					type: "achievement",
					title: "ACHIEVEMENT: COURSE COMPLETER",
					description: "You've successfully finished your first full course!",
					metadata: { achievementId: "course-completer" },
					createdAt: now,
				});
				await awardOnchainAchievement(
					program,
					backendSigner,
					learnerPublicKey,
					"course-completer",
				);
			}

			// Achievements: Track Specifics
			if (courseSlug.includes("rust")) {
				await db.insert(userActivity).values({
					id: uuidv4(),
					userId: learnerAddress,
					type: "achievement",
					title: "ACHIEVEMENT: RUST ROOKIE",
					description: "Completed the Rust Fundamentals track!",
					metadata: { achievementId: "rust-rookie" },
					createdAt: now,
				});
				await awardOnchainAchievement(
					program,
					backendSigner,
					learnerPublicKey,
					"rust-rookie",
				);
			} else if (courseSlug.includes("anchor")) {
				await db.insert(userActivity).values({
					id: uuidv4(),
					userId: learnerAddress,
					type: "achievement",
					title: "ACHIEVEMENT: ANCHOR EXPERT",
					description: "Mastered the Anchor Framework!",
					metadata: { achievementId: "anchor-expert" },
					createdAt: now,
				});
				await awardOnchainAchievement(
					program,
					backendSigner,
					learnerPublicKey,
					"anchor-expert",
				);
			}

			// Achievements: Full Stack Solana (Both major tracks)
			const rustCompleted = await db.query.courseProgress.findFirst({
				where: andOp(
					eqOp(courseProgress.userId, learnerAddress),
					sql`${courseProgress.courseId} LIKE '%rust%'`,
					eqOp(courseProgress.progress, 100),
				),
			});
			const anchorCompleted = await db.query.courseProgress.findFirst({
				where: andOp(
					eqOp(courseProgress.userId, learnerAddress),
					sql`${courseProgress.courseId} LIKE '%anchor%'`,
					eqOp(courseProgress.progress, 100),
				),
			});

			if (rustCompleted && anchorCompleted) {
				const [hasFullStack] = await db
					.select()
					.from(userActivity)
					.where(
						andOp(
							eqOp(userActivity.userId, learnerAddress),
							eqOp(userActivity.type, "achievement"),
							sql`${userActivity.metadata}->>'achievementId' = 'full-stack-solana'`,
						),
					);
				if (!hasFullStack) {
					await db.insert(userActivity).values({
						id: uuidv4(),
						userId: learnerAddress,
						type: "achievement",
						title: "ACHIEVEMENT: FULL STACK SOLANA",
						description: "Completed both Rust and Anchor tracks!",
						metadata: { achievementId: "full-stack-solana" },
						createdAt: now,
					});
					await awardOnchainAchievement(
						program,
						backendSigner,
						learnerPublicKey,
						"full-stack-solana",
					);
				}
			}
		} catch (dbError) {
			console.error("Failed to update DB gamification stats:", dbError);
		}

		return NextResponse.json({
			success: true,
			signature: tx,
			message: "Course finalized! Completion bonus rewarded.",
		});
	} catch (error) {
		console.error("Error finalizing course:", error);
		Sentry.captureException(error, {
			extra: { courseSlug, learnerAddress },
		});

		// Handle CourseAlreadyFinalized gracefully
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes("CourseAlreadyFinalized")) {
			return NextResponse.json({
				success: true,
				message: "Course was already finalized on-chain.",
			});
		}

		return NextResponse.json(
			{
				error: errorMessage,
			},
			{ status: 500 },
		);
	}
}
