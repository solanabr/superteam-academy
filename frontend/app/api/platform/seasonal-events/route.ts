import { NextRequest, NextResponse } from "next/server";

type SeasonalProgress = {
	joined: boolean;
	completedChallenges: number;
};

const challenges = [
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
] as const;

const rewards = [
	{ id: "reward-1", name: "Winter Badge", description: "Season completion badge", icon: "trophy" },
	{ id: "reward-2", name: "Snowflake NFT", description: "Limited seasonal collectible", icon: "snowflake" },
] as const;

const progressByUser = new Map<string, SeasonalProgress>();

export async function GET(request: NextRequest) {
	const userId = request.nextUrl.searchParams.get("userId") ?? "anonymous";
	const progress = progressByUser.get(userId) ?? { joined: false, completedChallenges: 0 };
	return NextResponse.json({
		currentEvent: {
			id: "winter-2026",
			name: "Winter Wonderland Challenge",
			description: "Complete Solana tasks and earn seasonal rewards",
			type: "winter",
			themes: ["snow", "solana", "learning"],
			startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
			endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
			totalChallenges: challenges.length,
			participants: progressByUser.size,
			status: "active",
		},
		upcomingEvents: [],
		challenges: challenges.map((challenge, index) => ({
			...challenge,
			completed: progress.completedChallenges > index,
		})),
		rewards: rewards.map((reward, index) => ({
			...reward,
			claimable: progress.completedChallenges > index,
		})),
		userProgress: progress,
	});
}

export async function POST(request: NextRequest) {
	const body = (await request.json()) as
		| { action: "join"; userId: string }
		| { action: "complete"; userId: string }
		| { action: "claim"; userId: string };
	const userId = body.userId;
	const current = progressByUser.get(userId) ?? { joined: false, completedChallenges: 0 };

	if (body.action === "join") {
		progressByUser.set(userId, { ...current, joined: true });
	}
	if (body.action === "complete") {
		progressByUser.set(userId, {
			...current,
			joined: true,
			completedChallenges: Math.min(current.completedChallenges + 1, challenges.length),
		});
	}
	if (body.action === "claim") {
		progressByUser.set(userId, { ...current, joined: true });
	}

	return NextResponse.json({ success: true });
}
