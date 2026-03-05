/**
 * @fileoverview Shared utility for awarding on-chain XP tokens.
 * Handles backend signing, ATA creation, and program interaction.
 */

import { AnchorProvider, BN, Program, type Wallet } from "@coral-xyz/anchor";
import {
	createAssociatedTokenAccountInstruction,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
	Connection,
	PublicKey,
	type Transaction,
	type VersionedTransaction,
} from "@solana/web3.js";
import { getBackendSigner } from "../utils/backend-signer";
import {
	CLUSTER_URL,
	getConfigPda,
	getMinterRolePda,
	TOKEN_2022_PROGRAM_ID,
	XP_MINT,
} from "./client";
import { OnchainAcademy } from "./idl/onchain_academy";
import IDL from "./idl/onchain_academy.json";

const connection = new Connection(CLUSTER_URL, "confirmed");

/**
 * Mints XP tokens to a recipient's wallet on-chain.
 * Used for ad-hoc rewards like daily challenges, achievements, and manual awards.
 */
export async function mintXp(
	recipient: PublicKey,
	amount: number,
	memo: string,
) {
	try {
		if (amount <= 0) return { success: true, message: "No XP to award" };

		// 1. Load Backend Signer
		const backendSigner = getBackendSigner();

		// 2. Initialize Program
		const provider = new AnchorProvider(
			connection,
			{
				publicKey: backendSigner.publicKey,
				signTransaction: async <T extends Transaction | VersionedTransaction>(
					tx: T,
				): Promise<T> => {
					if ("version" in tx) {
						tx.sign([backendSigner]);
					} else {
						tx.partialSign(backendSigner);
					}
					return tx;
				},
				signAllTransactions: async <
					T extends Transaction | VersionedTransaction,
				>(
					txs: T[],
				): Promise<T[]> => {
					return txs.map((tx) => {
						if ("version" in tx) {
							tx.sign([backendSigner]);
						} else {
							tx.partialSign(backendSigner);
						}
						return tx;
					});
				},
			} as Wallet,
			AnchorProvider.defaultOptions(),
		);
		const program = new Program<OnchainAcademy>(
			IDL as OnchainAcademy,
			provider,
		);

		// 3. Derive PDAs & Accounts
		const [configPda] = getConfigPda();
		const [minterRolePda] = getMinterRolePda(backendSigner.publicKey);
		const recipientTokenAccount = getAssociatedTokenAddressSync(
			XP_MINT,
			recipient,
			false,
			TOKEN_2022_PROGRAM_ID,
		);

		// 4. Check for ATA
		const instructions = [];
		const ataInfo = await connection.getAccountInfo(recipientTokenAccount);
		if (!ataInfo) {
			instructions.push(
				createAssociatedTokenAccountInstruction(
					backendSigner.publicKey,
					recipientTokenAccount,
					recipient,
					XP_MINT,
					TOKEN_2022_PROGRAM_ID,
				),
			);
		}

		// 5. Execute Mint
		const tx = await program.methods
			.rewardXp(new BN(amount), memo)
			.accountsPartial({
				config: configPda,
				minterRole: minterRolePda,
				xpMint: XP_MINT,
				recipientTokenAccount,
				minter: backendSigner.publicKey,
				tokenProgram: TOKEN_2022_PROGRAM_ID,
			})
			.preInstructions(instructions)
			.signers([backendSigner])
			.rpc();

		console.log(
			`[On-chain XP] Awarded ${amount} to ${recipient.toBase58()}. Sig: ${tx}`,
		);
		return { success: true, signature: tx };
	} catch (error) {
		console.error("[On-chain XP] Failed to mint XP:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown on-chain error",
		};
	}
}
