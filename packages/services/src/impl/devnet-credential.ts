import { MPLCoreCredentialService } from "./mpl-core-credential";
import { Connection } from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor";

export class DevnetCredentialService extends MPLCoreCredentialService {
	constructor(wallet?: Wallet) {
		// Devnet connection
		const connection = new Connection("https://api.devnet.solana.com", {
			commitment: "confirmed",
			confirmTransactionInitialTimeout: 60_000,
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
