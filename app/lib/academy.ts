import { Connection, PublicKey } from "@solana/web3.js";
import { AcademyClient } from "@superteam-academy/anchor";

let cachedConnection: Connection | null = null;
let cachedClient: AcademyClient | null = null;

function getRpcUrl(): string {
	const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY ?? process.env.HELIUS_API_KEY;
	if (heliusKey) {
		return `https://devnet.helius-rpc.com/?api-key=${heliusKey}`;
	}
	return process.env.NEXT_PUBLIC_SOLANA_RPC_URL??"https://api.devnet.solana.com";
}

export { getRpcUrl };

export function getProgramId(): PublicKey {
	const value = process.env.NEXT_PUBLIC_ACADEMY_PROGRAM_ID;
	if(!value){
		throw new Error("Academy program isnt set")
	}
	return new PublicKey(value);
}

export function getSolanaConnection(): Connection {
	if (!cachedConnection) {
		cachedConnection = new Connection(getRpcUrl(), "confirmed");
	}
	return cachedConnection;
}

export function getAcademyClient(): AcademyClient {
	if (!cachedClient) {
		cachedClient = new AcademyClient(getSolanaConnection(), getProgramId());
	}
	return cachedClient;
}

export type IndexedLearnerActivity = {
	signature: string;
	slot: number;
	timestamp: string;
	instruction: string;
	success: boolean;
};

export async function fetchIndexedLearnerActivity(
	learner: PublicKey,
	limit = 10
): Promise<IndexedLearnerActivity[]> {
	const connection = getSolanaConnection();
	const programId = getProgramId();
	const signatures = await connection.getSignaturesForAddress(learner, {
		limit: limit * 2,
	});

	const candidateSignatures = signatures
		.filter((entry) => entry.err === null)
		.map((entry) => ({
			signature: entry.signature,
			slot: entry.slot,
			blockTime: entry.blockTime,
		}));

	const batchSize = 10;
	const activity: IndexedLearnerActivity[] = [];

	for (let i = 0; i < candidateSignatures.length && activity.length < limit; i += batchSize) {
		const batch = candidateSignatures.slice(i, i + batchSize);
		const transactions = await Promise.all(
			batch.map((entry) =>
				connection
					.getParsedTransaction(entry.signature, { maxSupportedTransactionVersion: 0 })
					.then((transaction) => ({ entry, transaction }))
			)
		);

		for (const { entry, transaction } of transactions) {
			if (!transaction || activity.length >= limit) continue;
			const hasProgramInstruction = transaction.transaction.message.instructions.some(
				(instruction) =>
					"programId" in instruction ? instruction.programId.equals(programId) : false
			);
			if (!hasProgramInstruction) continue;

			const instructionFromLogs = transaction.meta?.logMessages
				?.map((line) => line.match(/Instruction:\s*([A-Za-z0-9_]+)/)?.[1] ?? null)
				.find(Boolean);

			activity.push({
				signature: entry.signature,
				slot: entry.slot,
				timestamp: new Date(
					(entry.blockTime ?? Math.floor(Date.now() / 1000)) * 1000
				).toISOString(),
				instruction: instructionFromLogs ?? "program_interaction",
				success: transaction.meta?.err == null,
			});
		}
	}

	return activity;
}

function decodeBase64Url(raw: string): Uint8Array {
	const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
	const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
	return Buffer.from(padded, "base64");
}

export function contentTxIdToArweaveUrl(contentTxId: Uint8Array): string {
	const base64 = Buffer.from(contentTxId).toString("base64");
	const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
	return `https://arweave.net/${base64url}`;
}

export function arweaveTxIdToBytes(txId: string): number[] {
	return Array.from(decodeBase64Url(txId));
}
