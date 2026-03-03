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
	const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
	tx.recentBlockhash = blockhash;

	const signature = await wallet.sendTransaction(tx, connection);
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
