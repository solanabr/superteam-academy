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

	// Let the wallet adapter handle blockhash assignment right before signing.
	// Fetching the blockhash early causes "block height exceeded" errors when
	// the user takes time to approve the transaction in their wallet UI.
	const signature = await wallet.sendTransaction(tx, connection);

	// Fetch a fresh blockhash for confirmation tracking after the tx is sent
	const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
	await connection.confirmTransaction(
		{ signature, blockhash, lastValidBlockHeight },
		"confirmed"
	);

	return signature;
}

export function isWalletReady(wallet: MinimalWallet): boolean {
	return !!(wallet.publicKey && wallet.sendTransaction);
}

export function canSignMessage(wallet: MinimalWallet): boolean {
	return !!(wallet.publicKey && wallet.signMessage);
}
