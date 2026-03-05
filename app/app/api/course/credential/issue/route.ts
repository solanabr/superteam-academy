/**
 * @fileoverview API route to issue or upgrade course credentials (NFTs) using Solana.
 * Integrates with the Onchain Academy program to mint or update track-based achievements.
 */

import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
	CLUSTER_URL,
	getConfigPda,
	getCoursePda,
	getEnrollmentPda,
	MPL_CORE_PROGRAM_ID,
} from "@/lib/anchor/client";
import { OnchainAcademy } from "@/lib/anchor/idl/onchain_academy";
import IDL from "@/lib/anchor/idl/onchain_academy.json";
import { TRACK_COLLECTIONS, TrackId } from "@/lib/constants/leaderboard";
import { db } from "@/lib/db";
import { userActivity } from "@/lib/db/schema";
import { getPostHogClient } from "@/lib/posthog-server";
import { getBackendSigner } from "@/lib/utils/backend-signer";

const connection = new Connection(CLUSTER_URL, "confirmed");

/**
 * Handles the issuance or upgrade of a course credential.
 * Requires `courseSlug` and `learnerAddress` in the request body.
 */
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			courseSlug: string;
			learnerAddress: string;
		};
		const { courseSlug, learnerAddress } = body;

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

		// 3. Derive PDAs and Fetch Data
		const [configPda] = getConfigPda();
		const [coursePda] = getCoursePda(courseSlug);
		const [enrollmentPda] = getEnrollmentPda(courseSlug, learnerPublicKey);

		const courseAccount = await program.account.course.fetch(coursePda);
		const enrollmentAccount =
			await program.account.enrollment.fetch(enrollmentPda);

		// Determine if this is an issue or upgrade
		const isUpgrade = !!enrollmentAccount.credentialAsset;
		// Determine which collection and track this belongs to
		const trackId = courseAccount.trackId;
		const trackCollectionAddress =
			TRACK_COLLECTIONS[trackId as TrackId] || "general";

		if (!trackCollectionAddress) {
			return NextResponse.json(
				{ error: `No collection found for track ${trackId}` },
				{ status: 400 },
			);
		}

		const trackCollection = new PublicKey(trackCollectionAddress);

		// Calculate stats for metadata
		const totalLessons = courseAccount.lessonCount;
		const xpPerLesson = courseAccount.xpPerLesson;
		const totalXp =
			totalLessons * xpPerLesson + Math.floor((totalLessons * xpPerLesson) / 2);

		let tx: string;

		if (!isUpgrade) {
			// ISSUE NEW CREDENTIAL
			const credentialAsset = Keypair.generate();
			tx = await program.methods
				.issueCredential(
					`${courseAccount.courseId} Credential`,
					"https://arweave.net/credential-metadata", // Should ideally be dynamic
					1, // Courses completed in track (should ideally be calculated)
					new BN(totalXp),
				)
				.accountsPartial({
					config: configPda,
					course: coursePda,
					enrollment: enrollmentPda,
					learner: learnerPublicKey,
					credentialAsset: credentialAsset.publicKey,
					trackCollection,
					payer: backendSigner.publicKey,
					backendSigner: backendSigner.publicKey,
					mplCoreProgram: MPL_CORE_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
				})
				.signers([backendSigner, credentialAsset])
				.rpc();
		} else {
			// UPGRADE EXISTING CREDENTIAL
			tx = await program.methods
				.upgradeCredential(
					`${courseAccount.courseId} Credential (Upgraded)`,
					"https://arweave.net/credential-metadata-v2",
					2, // courses completed
					new BN(totalXp * 2),
				)
				.accountsPartial({
					config: configPda,
					course: coursePda,
					enrollment: enrollmentPda,
					learner: learnerPublicKey,
					credentialAsset: enrollmentAccount.credentialAsset!,
					trackCollection,
					payer: backendSigner.publicKey,
					backendSigner: backendSigner.publicKey,
					mplCoreProgram: MPL_CORE_PROGRAM_ID,
					systemProgram: SystemProgram.programId,
				})
				.signers([backendSigner])
				.rpc();
		}

		// Track credential issuance server-side
		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: learnerAddress,
			event: "credential_issued",
			properties: {
				course_slug: courseSlug,
				is_upgrade: isUpgrade,
				track_id: trackId,
				transaction_signature: tx,
			},
		});
		await posthog.shutdown();

		// Add Activity record
		try {
			await db.insert(userActivity).values({
				id: uuidv4(),
				userId: learnerAddress,
				type: "achievement",
				title: isUpgrade
					? `CREDENTIAL UPGRADED: ${courseAccount.courseId}`
					: `CREDENTIAL ISSUED: ${courseAccount.courseId}`,
				description: isUpgrade
					? "Your on-chain learning track has reached a new milestone!"
					: "Successfully issued your first soulbound course credential!",
				metadata: { courseSlug, isUpgrade, signature: tx },
				createdAt: new Date(),
			});
		} catch (dbError) {
			console.error("Failed to update DB activity for credential:", dbError);
		}

		return NextResponse.json({
			success: true,
			signature: tx,
			message: isUpgrade ? "Credential upgraded!" : "Credential issued!",
		});
	} catch (error) {
		console.error("Error issuing credential:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to issue credential",
			},
			{ status: 500 },
		);
	}
}
