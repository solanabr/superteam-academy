import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
	connection,
	getEnrollmentPda,
	TOKEN_2022_PROGRAM_ID,
	XP_MINT,
} from "@/lib/anchor/client";
import { OnchainAcademy } from "@/lib/anchor/idl/onchain_academy";
import IDL from "@/lib/anchor/idl/onchain_academy.json";

/**
 * Service for querying on-chain data from Solana Devnet.
 */
export const onchainQueryService = {
	/**
	 * Fetches the XP balance (Token-2022) for a given learner address.
	 */
	async getXpBalance(learnerAddress: string): Promise<number> {
		try {
			const learnerPublicKey = new PublicKey(learnerAddress);
			const ata = getAssociatedTokenAddressSync(
				XP_MINT,
				learnerPublicKey,
				false,
				TOKEN_2022_PROGRAM_ID,
			);

			const balance = await connection.getTokenAccountBalance(ata);
			return Number(balance.value.amount);
		} catch (error) {
			console.warn("Could not fetch XP balance (ATA might not exist):", error);
			return 0;
		}
	},

	/**
	 * Fetches and decodes the enrollment progress bitmap for a course.
	 */
	async getEnrollmentProgress(courseSlug: string, learnerAddress: string) {
		try {
			const learnerPublicKey = new PublicKey(learnerAddress);
			const [enrollmentPda] = getEnrollmentPda(courseSlug, learnerPublicKey);

			const provider = new anchor.AnchorProvider(
				connection,
				{ publicKey: learnerPublicKey } as unknown as anchor.Wallet,
				anchor.AnchorProvider.defaultOptions(),
			);
			const program = new anchor.Program<OnchainAcademy>(
				IDL as OnchainAcademy,
				provider,
			);

			const enrollment =
				await program.account.enrollment.fetchNullable(enrollmentPda);
			if (!enrollment) return null;

			return {
				lessonFlags: enrollment.lessonFlags, // [u64; 4] as BN[]
				completedAt: enrollment.completedAt,
				credentialAsset: enrollment.credentialAsset,
			};
		} catch (error) {
			console.error("Error fetching enrollment progress:", error);
			return null;
		}
	},

	/**
	 * Calculates total completed lessons from the bitmap.
	 */
	countCompletedLessons(lessonFlags: anchor.BN[]): number {
		return lessonFlags.reduce((sum, word) => {
			let count = 0;
			let w = word.clone();
			while (!w.isZero()) {
				if (w.and(new anchor.BN(1)).toNumber() === 1) count++;
				w = w.shrn(1);
			}
			return sum + count;
		}, 0);
	},

	/**
	 * Fetches the creation date (block time) of an on-chain asset.
	 */
	async getAssetIssueDate(assetAddress: string): Promise<string> {
		try {
			const pubkey = new PublicKey(assetAddress);
			const signatures = await connection.getSignaturesForAddress(pubkey, {
				limit: 10,
			});

			if (signatures.length === 0) return "ON-CHAIN PROOF";

			// The last signature in the list (or first found chronologically)
			// usually represents the mint/create transaction if limit is small enough
			const earliest = signatures[signatures.length - 1];
			if (!earliest.blockTime) return "ON-CHAIN PROOF";

			const date = new Date(earliest.blockTime * 1000);
			return date
				.toLocaleDateString("en-US", {
					month: "long",
					day: "numeric",
					year: "numeric",
				})
				.toUpperCase();
		} catch (error) {
			console.error("Error fetching asset issue date:", error);
			return "ON-CHAIN PROOF";
		}
	},

	/**
	 * Fetches a Metaplex Core asset and parses basic info.
	 */
	async getCoreAsset(assetAddress: string) {
		try {
			const pubkey = new PublicKey(assetAddress);
			const account = await connection.getAccountInfo(pubkey);
			if (!account) return null;

			const data = account.data;
			// Basic parsing of name from Core Asset layout (Offset 66: length (4) + data)
			let name = "On-Chain Certificate";
			let uri = "";
			try {
				const nameLen = data.readUInt32LE(66);
				name = data.slice(70, 70 + nameLen).toString("utf-8");

				// URI follows name: 4 bytes len + name string
				const uriOffset = 70 + nameLen;
				const uriLen = data.readUInt32LE(uriOffset);
				uri = data
					.slice(uriOffset + 4, uriOffset + 4 + uriLen)
					.toString("utf-8");
			} catch (e) {
				console.warn("Failed to parse core asset name/uri:", e);
			}

			return {
				pubkey: assetAddress,
				owner: new PublicKey(data.slice(1, 33)).toBase58(),
				name,
				uri,
			};
		} catch (error) {
			console.error("Error fetching core asset:", error);
			return null;
		}
	},
};
