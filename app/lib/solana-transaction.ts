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

	// Do NOT pre-set recentBlockhash. The wallet adapter's prepareTransaction
	// fetches it right before signing — this keeps the blockhash as fresh as
	// possible, even if the user takes 30-60s to approve in their wallet popup.
	const signature = await wallet.sendTransaction(tx, connection, {
		maxRetries: 5,
		skipPreflight: true,
	});

	// Poll for confirmation using getSignatureStatuses over HTTP.
	// We use a time-based timeout (90s) instead of block-height tracking
	// because we don't hold the lastValidBlockHeight from the wallet's
	// blockhash fetch. 90s exceeds the ~60s devnet blockhash validity window,
	// giving the RPC node enough retries to land the transaction.
	const POLL_INTERVAL_MS = 1500;
	const TIMEOUT_MS = 90_000;
	const deadline = Date.now() + TIMEOUT_MS;

	while (Date.now() < deadline) {
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

	throw new Error(`Transaction ${signature} was not confirmed within ${TIMEOUT_MS / 1000}s`);
}

export function isWalletReady(wallet: MinimalWallet): boolean {
	return !!(wallet.publicKey && wallet.sendTransaction);
}

export function canSignMessage(wallet: MinimalWallet): boolean {
	return !!(wallet.publicKey && wallet.signMessage);
}
