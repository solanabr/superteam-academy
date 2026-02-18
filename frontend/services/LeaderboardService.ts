import { PublicKey } from "@solana/web3.js";
import { BaseService } from "./types";
import { AcademyClient } from "@superteam/anchor";
import { findToken2022ATA } from "@superteam/solana";

export interface LeaderboardEntry {
	rank: number;
	publicKey: string;
	xpBalance: bigint;
	displayName?: string;
}

export class LeaderboardService extends BaseService {
	private client: AcademyClient;

	constructor(...args: ConstructorParameters<typeof BaseService>) {
		super(...args);
		this.client = new AcademyClient(this.connection, this.programId);
	}

	/** Fetch XP balance for a single user */
	async getUserXp(learner: PublicKey, xpMint: PublicKey): Promise<bigint> {
		const ata = findToken2022ATA(learner, xpMint);
		const balance = await this.client.fetchXpBalance(ata);
		return balance ?? 0n;
	}

	/**
	 * Fetch leaderboard entries.
	 * Uses token largest accounts and decodes ATA owner at byte offset 32.
	 */
	async getLeaderboard(xpMint: PublicKey, limit: number): Promise<LeaderboardEntry[]> {
		const largest = await this.connection.getTokenLargestAccounts(xpMint);
		const topTokenAccounts = largest.value.slice(0, Math.max(limit * 2, limit));
		if (topTokenAccounts.length === 0) return [];

		const accountPubkeys = topTokenAccounts.map((entry) => entry.address);
		const infos = await this.connection.getMultipleAccountsInfo(accountPubkeys);

		const byOwner = new Map<string, bigint>();
		for (let index = 0; index < infos.length; index += 1) {
			const info = infos[index];
			if (!info || info.data.length < 72) continue;

			const owner = new PublicKey(info.data.subarray(32, 64)).toBase58();
			const amount = info.data.readBigUInt64LE(64);
			const current = byOwner.get(owner) ?? 0n;
			if (amount > current) {
				byOwner.set(owner, amount);
			}
		}

		return [...byOwner.entries()]
			.sort((a, b) => (a[1] > b[1] ? -1 : 1))
			.slice(0, limit)
			.map(([publicKey, xpBalance], index) => ({
				rank: index + 1,
				publicKey,
				xpBalance,
			}));
	}
}
