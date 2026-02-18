import type { PublicKey } from "@solana/web3.js";
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
	 * In production, this would use Helius DAS API to query all Token-2022
	 * holders of the XP mint, sorted by balance. For now, we provide the
	 * lookup method for individual users.
	 */
	async getLeaderboard(_xpMint: PublicKey, _limit: number): Promise<LeaderboardEntry[]> {
		// Production implementation would use:
		// GET https://mainnet.helius-rpc.com/?api-key=KEY
		// { method: "getTokenLargestAccounts", params: [xpMint.toBase58()] }
		// Then resolve ATAs to wallet owners.
		return [];
	}
}
