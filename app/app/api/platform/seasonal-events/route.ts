import { type NextRequest, NextResponse } from "next/server";
import {
	getChallenges,
	getRewards,
	getSeasonalBaseState,
	getSeasonalParticipantsCount,
	getSeasonalProgress,
	setSeasonalProgress,
} from "@/lib/seasonal-events-store";

export async function GET(request: NextRequest) {
	const userId = request.nextUrl.searchParams.get("userId") ?? "anonymous";
	const progress = getSeasonalProgress(userId);
	const event = getSeasonalBaseState();
	const challenges = getChallenges();
	const rewards = getRewards();
	return NextResponse.json({
		currentEvent: {
			id: event.eventId,
			name: event.name,
			description: event.description,
			type: event.type,
			themes: event.themes,
			startDate: event.startDate,
			endDate: event.endDate,
			totalChallenges: challenges.length,
			participants: getSeasonalParticipantsCount(),
			status: event.status,
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
	const current = getSeasonalProgress(userId);
	const challenges = getChallenges();

	if (body.action === "join") {
		setSeasonalProgress(userId, { ...current, joined: true });
	}
	if (body.action === "complete") {
		setSeasonalProgress(userId, {
			...current,
			joined: true,
			completedChallenges: Math.min(current.completedChallenges + 1, challenges.length),
		});
	}
	if (body.action === "claim") {
		setSeasonalProgress(userId, { ...current, joined: true });
	}

	return NextResponse.json({ success: true });
}
