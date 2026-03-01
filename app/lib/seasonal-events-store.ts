type SeasonalProgress = {
	joined: boolean;
	completedChallenges: number;
};

type SeasonalChallenge = {
	id: string;
	title: string;
	description: string;
	points: number;
	difficulty: "easy" | "medium" | "hard";
	timeLimit?: number;
};

type SeasonalReward = {
	id: string;
	name: string;
	description: string;
	icon: string;
};

const challenges: SeasonalChallenge[] = [
	{
		id: "challenge-1",
		title: "Winter Chain Warmup",
		description: "Ship one on-chain interaction",
		points: 100,
		difficulty: "easy",
		timeLimit: 30,
	},
	{
		id: "challenge-2",
		title: "SBT Badge Mint",
		description: "Mint a credential-style NFT",
		points: 200,
		difficulty: "medium",
		timeLimit: 60,
	},
];

const rewards: SeasonalReward[] = [
	{
		id: "reward-1",
		name: "Winter Badge",
		description: "Season completion badge",
		icon: "trophy",
	},
	{
		id: "reward-2",
		name: "Snowflake NFT",
		description: "Limited seasonal collectible",
		icon: "snowflake",
	},
];

const progressByUser = new Map<string, SeasonalProgress>();
let eventStatus: "upcoming" | "active" | "ended" = "active";

export function getSeasonalBaseState() {
	return {
		eventId: "winter-2026",
		name: "Winter Wonderland Challenge",
		description: "Complete Solana tasks and earn seasonal rewards",
		type: "winter" as const,
		themes: ["snow", "solana", "learning"],
		startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
		endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
		status: eventStatus,
	};
}

export function getChallenges() {
	return challenges;
}

export function getRewards() {
	return rewards;
}

export function getSeasonalProgress(userId: string): SeasonalProgress {
	return progressByUser.get(userId) ?? { joined: false, completedChallenges: 0 };
}

export function setSeasonalProgress(userId: string, next: SeasonalProgress): SeasonalProgress {
	progressByUser.set(userId, next);
	return next;
}

export function getSeasonalParticipantsCount(): number {
	return progressByUser.size;
}

export function setSeasonalEventStatus(status: "upcoming" | "active" | "ended") {
	eventStatus = status;
}

export function resetSeasonalUserProgress(userId: string) {
	progressByUser.delete(userId);
}

export function listSeasonalUsers() {
	return [...progressByUser.entries()].map(([userId, progress]) => ({ userId, ...progress }));
}
