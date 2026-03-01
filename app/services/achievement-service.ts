import type { PublicKey } from "@solana/web3.js";
import { BaseService } from "./types";
import { AcademyClient, type AchievementTypeAccount } from "@superteam-academy/anchor";

interface AchievementInfo {
	achievementId: string;
	name: string;
	metadataUri: string;
	collection: string;
	xpReward: number;
	maxSupply: number;
	currentSupply: number;
	isActive: boolean;
	createdAt: number;
	/** Whether this learner has earned this achievement */
	earned: boolean;
	/** Timestamp of when the learner earned it, if applicable */
	awardedAt: number | null;
	/** On-chain NFT asset address, if earned */
	asset: string | null;
}

export class AchievementService extends BaseService {
	private client: AcademyClient;

	constructor(...args: ConstructorParameters<typeof BaseService>) {
		super(...args);
		this.client = new AcademyClient(this.connection, this.programId);
	}

	async getAllAchievementTypes(): Promise<AchievementTypeAccount[]> {
		const results = await this.client.fetchAllAchievementTypes();
		return results.map((r) => r.account);
	}

	async getLearnerAchievements(learner: PublicKey): Promise<AchievementInfo[]> {
		const types = await this.client.fetchAllAchievementTypes();

		const achievements = await Promise.all(
			types.map(async ({ account }) => {
				const receipt = await this.client.fetchAchievementReceipt(
					account.achievementId,
					learner
				);

				return {
					achievementId: account.achievementId,
					name: account.name,
					metadataUri: account.metadataUri,
					collection: account.collection.toBase58(),
					xpReward: account.xpReward,
					maxSupply: account.maxSupply,
					currentSupply: account.currentSupply,
					isActive: account.isActive,
					createdAt: account.createdAt,
					earned: receipt !== null,
					awardedAt: receipt?.awardedAt ?? null,
					asset: receipt?.asset.toBase58() ?? null,
				};
			})
		);

		return achievements;
	}

	async hasAchievement(achievementId: string, learner: PublicKey): Promise<boolean> {
		const receipt = await this.client.fetchAchievementReceipt(achievementId, learner);
		return receipt !== null;
	}
}
