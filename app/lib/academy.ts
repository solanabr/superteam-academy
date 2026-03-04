import { Connection, PublicKey } from "@solana/web3.js";
import {
	AcademyClient,
	type ConfigAccount,
	type CourseAccount,
	type EnrollmentAccount,
	type AchievementTypeAccount,
	type AchievementReceiptAccount,
} from "@superteam-academy/anchor";
import { getRpcCache } from "./rpc-cache";

let cachedConnection: Connection | null = null;
let cachedClient: CachedAcademyClient | null = null;

function getRpcUrl(): string {
	const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY ?? process.env.HELIUS_API_KEY;
	if (heliusKey) {
		return `https://devnet.helius-rpc.com/?api-key=${heliusKey}`;
	}
	return process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
}

export { getRpcUrl };

export function getProgramId(): PublicKey {
	const value = process.env.NEXT_PUBLIC_ACADEMY_PROGRAM_ID;
	if (!value) {
		throw new Error("Academy program isnt set");
	}
	return new PublicKey(value);
}

export function getSolanaConnection(): Connection {
	if (!cachedConnection) {
		cachedConnection = new Connection(getRpcUrl(), "confirmed");
	}
	return cachedConnection;
}

export function getAcademyClient(): CachedAcademyClient {
	if (!cachedClient) {
		cachedClient = new CachedAcademyClient(getSolanaConnection(), getProgramId());
	}
	return cachedClient;
}

/**
 * AcademyClient wrapper that caches expensive RPC reads and deduplicates
 * concurrent in-flight requests. Delegates all calls to the underlying
 * AcademyClient — no behaviour changes, just fewer RPC round-trips.
 */
export class CachedAcademyClient extends AcademyClient {
	private rpc = getRpcCache();

	// --- Cached "fetchAll" methods (globally shared, infrequent mutations) ---

	override fetchConfig(): Promise<ConfigAccount | null> {
		return this.rpc.get("config", () => super.fetchConfig(), 60_000);
	}

	override fetchAllCourses(): Promise<Array<{ pubkey: PublicKey; account: CourseAccount }>> {
		return this.rpc.get("allCourses", () => super.fetchAllCourses(), 30_000);
	}

	override fetchAllEnrollments(): Promise<
		Array<{ pubkey: PublicKey; account: EnrollmentAccount }>
	> {
		return this.rpc.get("allEnrollments", () => super.fetchAllEnrollments(), 15_000);
	}

	override fetchAllAchievementTypes(): Promise<
		Array<{ pubkey: PublicKey; account: AchievementTypeAccount }>
	> {
		return this.rpc.get("allAchievementTypes", () => super.fetchAllAchievementTypes(), 60_000);
	}

	// --- Per-key cached methods ---

	override fetchCourse(courseId: string): Promise<CourseAccount | null> {
		return this.rpc.get(`course:${courseId}`, () => super.fetchCourse(courseId), 30_000);
	}

	override fetchEnrollment(
		courseId: string,
		learner: PublicKey
	): Promise<EnrollmentAccount | null> {
		const key = `enrollment:${courseId}:${learner.toBase58()}`;
		return this.rpc.get(key, () => super.fetchEnrollment(courseId, learner), 10_000);
	}

	override fetchEnrollmentsForLearner(
		learner: PublicKey,
		courses?: Array<{ pubkey: PublicKey; account: CourseAccount }>
	): Promise<Array<{ pubkey: PublicKey; account: EnrollmentAccount }>> {
		const key = `enrollmentsFor:${learner.toBase58()}`;
		return this.rpc.get(key, () => super.fetchEnrollmentsForLearner(learner, courses), 15_000);
	}

	override fetchAchievementReceipt(
		achievementId: string,
		recipient: PublicKey
	): Promise<AchievementReceiptAccount | null> {
		const key = `achievementReceipt:${achievementId}:${recipient.toBase58()}`;
		return this.rpc.get(
			key,
			() => super.fetchAchievementReceipt(achievementId, recipient),
			30_000
		);
	}

	override fetchXpBalance(learnerAta: PublicKey): Promise<bigint | null> {
		const key = `xpBalance:${learnerAta.toBase58()}`;
		return this.rpc.get(key, () => super.fetchXpBalance(learnerAta), 10_000);
	}

	/** Invalidate enrollment caches after a mutation (enroll/close/complete) */
	invalidateEnrollments(courseId?: string, learner?: PublicKey): void {
		this.rpc.invalidate("allEnrollments");
		if (learner) {
			this.rpc.invalidatePrefix(`enrollmentsFor:${learner.toBase58()}`);
		}
		if (courseId && learner) {
			this.rpc.invalidate(`enrollment:${courseId}:${learner.toBase58()}`);
		}
	}
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
