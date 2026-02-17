import { MPLCoreCredentialService } from "./mpl-core-credential";
import { Connection } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";

export class MainnetCredentialService extends MPLCoreCredentialService {
	constructor(wallet?: Wallet) {
		// Mainnet connection with higher commitment
		const connection = new Connection("https://api.mainnet-beta.solana.com", {
			commitment: "confirmed",
			confirmTransactionInitialTimeout: 120_000,
		});

		// Use provided wallet or create a dummy one for read-only operations
		const defaultWallet =
			wallet ||
			({
				publicKey: { toString: () => "11111111111111111111111111111112" },
				signTransaction: async () => {
					throw new Error("Read-only wallet");
				},
				signAllTransactions: async () => {
					throw new Error("Read-only wallet");
				},
			} as unknown as Wallet);

		super(connection, defaultWallet);
	}
}
