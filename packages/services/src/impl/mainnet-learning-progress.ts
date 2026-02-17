import { SolanaLearningProgressService } from "./solana-learning-progress";
import { Connection, PublicKey } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";

export class MainnetLearningProgressService extends SolanaLearningProgressService {
	constructor(wallet?: Wallet) {
		// Mainnet program ID (placeholder - should be deployed program ID)
		const programId = new PublicKey("3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb");

		// Mainnet connection with higher commitment level
		const connection = new Connection("https://api.mainnet-beta.solana.com", {
			commitment: "confirmed",
			confirmTransactionInitialTimeout: 120_000, // Longer timeout for mainnet
		});

		// Use provided wallet or create a dummy one for read-only operations
		const defaultWallet =
			wallet ||
			({
				publicKey: PublicKey.default,
				signTransaction: async () => {
					throw new Error("Read-only wallet");
				},
				signAllTransactions: async () => {
					throw new Error("Read-only wallet");
				},
			} as unknown as Wallet);

		super(connection, programId, defaultWallet);
	}
}
