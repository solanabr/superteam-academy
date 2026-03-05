/**
 * @fileoverview API route to award achievements as soulbound NFTs.
 */

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
	CLUSTER_URL,
	getAchievementReceiptPda,
	getAchievementTypePda,
	getConfigPda,
	getMinterRolePda,
	MPL_CORE_PROGRAM_ID,
	TOKEN_2022_PROGRAM_ID,
} from "@/lib/anchor/client";
import { OnchainAcademy } from "@/lib/anchor/idl/onchain_academy";
import IDL from "@/lib/anchor/idl/onchain_academy.json";
import { db } from "@/lib/db";
import { userActivity } from "@/lib/db/schema";
import { getPostHogClient } from "@/lib/posthog-server";
import { getBackendSigner } from "@/lib/utils/backend-signer";

const connection = new Connection(CLUSTER_URL, "confirmed");

/**
 * Handles awarding an achievement to a learner.
 * Verifies the achievement type on-chain and mints a soulbound NFT receipt.
 */
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			achievementId: string;
			learnerAddress: string;
		};
		const { achievementId, learnerAddress } = body;

		if (!achievementId || !learnerAddress) {
			return NextResponse.json(
				{ error: "Missing achievementId or learnerAddress" },
				{ status: 400 },
			);
		}

		const learnerPublicKey = new PublicKey(learnerAddress);

		// 1. Load Backend Signer (which should be registered as a Minter)
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

		// 3. Derive PDAs
		const [configPda] = getConfigPda();
		const [achievementTypePda] = getAchievementTypePda(achievementId);
		const [receiptPda] = getAchievementReceiptPda(
			achievementId,
			learnerPublicKey,
		);
		const [minterRolePda] = getMinterRolePda(backendSigner.publicKey);

		// 4. Fetch Meta
		const achievementType =
			await program.account.achievementType.fetch(achievementTypePda);
		const XP_MINT = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT!);

		const learnerTokenAccount = getAssociatedTokenAddressSync(
			XP_MINT,
			learnerPublicKey,
			false,
			TOKEN_2022_PROGRAM_ID,
		);

		// 5. Award Achievement
		const assetValue = Keypair.generate();
		const tx = await program.methods
			.awardAchievement()
			.accountsPartial({
				config: configPda,
				achievementType: achievementTypePda,
				achievementReceipt: receiptPda,
				minterRole: minterRolePda,
				asset: assetValue.publicKey,
				collection: achievementType.collection,
				recipient: learnerPublicKey,
				recipientTokenAccount: learnerTokenAccount,
				xpMint: XP_MINT,
				payer: backendSigner.publicKey,
				minter: backendSigner.publicKey,
				mplCoreProgram: MPL_CORE_PROGRAM_ID,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
				systemProgram: SystemProgram.programId,
			})
			.signers([backendSigner, assetValue])
			.rpc();

		// Activity Feed Update
		await db.insert(userActivity).values({
			id: uuidv4(),
			userId: learnerAddress,
			type: "achievement",
			title: `ACHIEVEMENT UNLOCKED: ${achievementType.name}`,
			description: `You've earned a special badge!`,
			xpEarned: achievementType.xpReward,
			metadata: { achievementId, signature: tx },
			createdAt: new Date(),
		});

		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: learnerAddress,
			event: "achievement_awarded",
			properties: {
				achievement_id: achievementId,
				name: achievementType.name,
				transaction_signature: tx,
			},
		});
		await posthog.shutdown();

		return NextResponse.json({
			success: true,
			signature: tx,
			message: `Achievement '${achievementType.name}' awarded!`,
		});
	} catch (error) {
		console.error("Error awarding achievement:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to award achievement",
			},
			{ status: 500 },
		);
	}
}
