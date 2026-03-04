import type { Connection, TransactionInstruction, PublicKey } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";

interface MinimalWallet {
	publicKey: { toBase58(): string } | null;
	sendTransaction?: (...args: unknown[]) => Promise<string>;
	signTransaction?: (tx: Transaction | unknown) => Promise<Transaction | unknown>;
	signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}

export async function sendAndConfirmTx(
	connection: Connection,
	wallet: MinimalWallet,
	instruction: TransactionInstruction
): Promise<string> {
	if (!wallet.publicKey) {
		throw new Error("Wallet not connected");
	}
	if (!wallet.signTransaction) {
		throw new Error("Wallet does not support signTransaction");
	}

	const tx = new Transaction().add(instruction);
	tx.feePayer = wallet.publicKey as PublicKey;

	// Fetch a fresh blockhash from OUR connection (Helius) right before
	// asking the wallet to sign. User approval time in the popup doesn't
	// matter much — blockhashes are valid for ~60s on devnet.
	const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
	tx.recentBlockhash = blockhash;

	// Sign via wallet popup — only signs, does NOT send.
	const signed = (await wallet.signTransaction(tx)) as Transaction;

	// Send through OUR Helius RPC (not the wallet's internal RPC which may
	// silently drop transactions on devnet).
	const signature = await connection.sendRawTransaction(signed.serialize(), {
		maxRetries: 5,
		skipPreflight: true,
	});

	// Poll for confirmation using getSignatureStatuses (HTTP, always reliable).
	const POLL_INTERVAL_MS = 1500;
	const deadline = Date.now() + 60_000;

	while (Date.now() < deadline) {
		const currentHeight = await connection.getBlockHeight("confirmed");
		if (currentHeight > lastValidBlockHeight) {
			throw new Error(
				"Transaction was not confirmed: block height exceeded. Please try again."
			);
		}

		const { value } = await connection.getSignatureStatuses([signature]);
		const status = value?.[0];
		if (status) {
			if (status.err) {
				throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
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

	throw new Error("Transaction was not confirmed in time. Please try again.");
}

export function isWalletReady(wallet: MinimalWallet): boolean {
	return !!(wallet.publicKey && wallet.signTransaction);
}

export function canSignMessage(wallet: MinimalWallet): boolean {
	return !!(wallet.publicKey && wallet.signMessage);
}
