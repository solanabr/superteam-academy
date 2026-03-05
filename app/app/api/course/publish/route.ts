/**
 * @fileoverview Course publishing route handler.
 * Creates a course on-chain via the Solana program and updates the course status in Sanity.
 */

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { getBackendSigner } from "@/lib/utils/backend-signer";
import { CLUSTER_URL, getConfigPda, getCoursePda } from "@/lib/anchor/client";
import type { OnchainAcademy } from "@/lib/anchor/idl/onchain_academy";
import IDL from "@/lib/anchor/idl/onchain_academy.json";
import { getSessionServer } from "@/lib/auth/server";
import { client } from "@/sanity/client";
import { db } from "@/lib/db";
import { userActivity } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";

// Write-enabled client
const writeClient = createClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "replace-me-123",
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
	apiVersion: "2024-02-20",
	token: process.env.SANITY_API_TOKEN,
	useCdn: false,
});

const connection = new Connection(CLUSTER_URL, "confirmed");

/**
 * Handles the publication of a course from Sanity to the Solana blockchain.
 * Validates course structure, derives PDAs, and sends the `createCourse` transaction.
 */
export async function POST(request: Request) {
	try {
		const { courseId, courseSlug, creatorAddress } = await request.json();

		if (!courseId || !courseSlug || !creatorAddress) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 },
			);
		}

		// 0. Verify Admin Session
		const session = await getSessionServer();
		if (!session || (session.user as { role?: string }).role !== "admin") {
			return NextResponse.json(
				{ error: "Unauthorized: Admins only" },
				{ status: 401 },
			);
		}

		const creatorPublicKey = new PublicKey(creatorAddress);

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

		// 2. Fetch course from Sanity
		const course = await client.fetch(
			`*[_type == "course" && slug.current == $slug][0] {
        _id,
        title,
        "slug": slug.current,
        description,
        difficulty,
        track_id,
        track_level,
        xp_per_lesson,
        creator_reward_xp,
        min_completions_for_reward,
        "moduleCount": count(modules),
        prerequisite_course-> { "slug": slug.current },
        modules[]-> {
          lessons[]-> {
            _id
          }
        }
      }`,
			{ slug: courseSlug },
		);

		if (!course) {
			return NextResponse.json(
				{ error: "Course not found in Sanity" },
				{ status: 404 },
			);
		}

		interface SanityModule {
			lessons?: { _id: string }[];
		}

		// Validate course data
		const totalLessons =
			course.modules?.reduce(
				(sum: number, module: SanityModule) =>
					sum + (module.lessons?.length || 0),
				0,
			) || 0;

		if (totalLessons === 0) {
			return NextResponse.json(
				{ error: "Course must have at least one lesson" },
				{ status: 400 },
			);
		}

		// 3. Initialize Program
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

		// 4. Derive PDAs
		const [configPda] = getConfigPda();
		const [coursePda] = getCoursePda(courseSlug);

		const difficultyNum =
			typeof course.difficulty === "string"
				? course.difficulty === "advanced"
					? 3
					: course.difficulty === "intermediate"
						? 2
						: 1
				: course.difficulty || 1;

		// Generate a unique 32-byte hash for contentTxId based on course metadata
		const hashInput = `${courseSlug}-${course._id}-${totalLessons}-${course.xp_per_lesson}`;
		const contentHash = crypto.createHash("sha256").update(hashInput).digest();

		// Prerequisite handling
		let prerequisitePda: PublicKey | null = null;
		if (course.prerequisite_course?.slug) {
			const [pda] = getCoursePda(course.prerequisite_course.slug);
			prerequisitePda = pda;
		}

		// 5. Send Transaction
		const tx = await program.methods
			.createCourse({
				courseId: course.slug,
				creator: creatorPublicKey,
				contentTxId: Array.from(contentHash),
				lessonCount: totalLessons,
				difficulty: difficultyNum,
				xpPerLesson: course.xp_per_lesson || 100,
				trackId: course.track_id || 1,
				trackLevel: course.track_level || 1,
				prerequisite: prerequisitePda,
				creatorRewardXp: course.creator_reward_xp || 50,
				minCompletionsForReward: course.min_completions_for_reward || 5,
			})
			.accountsPartial({
				course: coursePda,
				config: configPda,
				authority: backendSigner.publicKey,
				systemProgram: SystemProgram.programId,
			})
			.signers([backendSigner])
			.rpc();

		// 6. Update Sanity Document & Record System Activity
		if (process.env.SANITY_API_TOKEN) {
			await writeClient
				.patch(courseId)
				.set({
					status: "published",
					onChainStatus: "published",
					coursePda: coursePda.toBase58(),
					publishedAt: new Date().toISOString(),
				})
				.commit();

			await db.insert(userActivity).values({
				id: uuidv4(),
				userId: session.user.id,
				type: "course_published",
				title: `COURSE PUBLISHED: ${course.title}`,
				description: `Admin published course '${course.slug}' to the blockchain.`,
				courseId: course.slug,
				metadata: {
					courseSlug: course.slug,
					coursePda: coursePda.toBase58(),
					txSignature: tx,
				},
			});
		} else {
			console.warn(
				"SANITY_API_TOKEN missing: Course published on-chain but status not updated in Sanity.",
			);
		}

		return NextResponse.json({
			success: true,
			signature: tx,
			coursePda: coursePda.toBase58(),
			message: "Course published successfully.",
		});
	} catch (error) {
		console.error("Error creating course:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to create course",
			},
			{ status: 500 },
		);
	}
}
