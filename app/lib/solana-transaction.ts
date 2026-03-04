import type { Connection, TransactionInstruction, PublicKey } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";

interface MinimalWallet {
	publicKey: { toBase58(): string } | null;
	sendTransaction?: (...args: unknown[]) => Promise<string>;
	signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}

export async function sendAndConfirmTx(
	connection: Connection,
	wallet: MinimalWallet,
	instruction: TransactionInstruction
): Promise<string> {
	if (!wallet.publicKey || !wallet.sendTransaction) {
		throw new Error("Wallet not connected");
	}

	const tx = new Transaction().add(instruction);
	tx.feePayer = wallet.publicKey as PublicKey;

	// Fetch blockhash and set it on the tx before the wallet signs so we hold
	// the matching lastValidBlockHeight for our confirmation poll. The wallet
	// adapter's prepareTransaction skips refetching when recentBlockhash is
	// already present.
	const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
	tx.recentBlockhash = blockhash;

	const signature = await wallet.sendTransaction(tx, connection, {
		maxRetries: 5,
		skipPreflight: true,
	});

	// Poll with getSignatureStatuses instead of confirmTransaction.
	// confirmTransaction relies on WebSocket subscriptions which are unreliable
	// from localhost (and in many browser environments). Polling over HTTP is
	// rock-solid and typically confirms within 1-3 iterations.
	const POLL_INTERVAL_MS = 1000;
	for (;;) {
		const currentHeight = await connection.getBlockHeight("confirmed");
		if (currentHeight > lastValidBlockHeight) {
			throw new Error(
				`Transaction ${signature} expired: block height ${currentHeight} exceeded lastValidBlockHeight ${lastValidBlockHeight}`
			);
		}

		const { value } = await connection.getSignatureStatuses([signature]);
		const status = value?.[0];
		if (status) {
			if (status.err) {
				throw new Error(`Transaction ${signature} failed: ${JSON.stringify(status.err)}`);
			}
			if (
				status.confirmationStatus === "confirmed" ||
				status.confirmationStatus === "finalized"
			) {
				return signature;
			}
		}

		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
	}
}

export function isWalletReady(wallet: MinimalWallet): boolean {
	return !!(wallet.publicKey && wallet.sendTransaction);
}

export function canSignMessage(wallet: MinimalWallet): boolean {
	return !!(wallet.publicKey && wallet.signMessage);
}
