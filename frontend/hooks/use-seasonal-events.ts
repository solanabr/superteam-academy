/**
 * Seasonal Events Hook
 * Manages seasonal events, challenges, and rewards
 */

import { useState, useEffect, useCallback } from "react";

interface SeasonalEvent {
	id: string;
	name: string;
	description: string;
	type: "winter" | "summer" | "holiday" | "competition";
	themes: string[];
	startDate: Date;
	endDate: Date;
	totalChallenges: number;
	participants: number;
	status: "upcoming" | "active" | "ended";
}

interface Challenge {
	id: string;
	title: string;
	description: string;
	points: number;
	difficulty: "easy" | "medium" | "hard";
	timeLimit?: number; // in minutes
	completed: boolean;
}

interface Reward {
	id: string;
	name: string;
	description: string;
	icon: string;
	claimable: boolean;
}

interface UserProgress {
	joined: boolean;
	completedChallenges: number;
}

export function useSeasonalEvents(_userId: string) {
	const [currentEvent, setCurrentEvent] = useState<SeasonalEvent | null>(null);
	const [upcomingEvents, setUpcomingEvents] = useState<SeasonalEvent[]>([]);
	const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
	const [challenges, setChallenges] = useState<Challenge[]>([]);
	const [rewards, setRewards] = useState<Reward[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadSeasonalEvents = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/platform/seasonal-events?userId=${encodeURIComponent(_userId)}`, {
				method: "GET",
				cache: "no-store",
			});
			if (!response.ok) {
				throw new Error("Unable to load seasonal events");
			}
			const payload = (await response.json()) as {
				currentEvent: Omit<SeasonalEvent, "startDate" | "endDate"> & {
					startDate: string;
					endDate: string;
				};
				upcomingEvents: Array<Omit<SeasonalEvent, "startDate" | "endDate"> & { startDate: string; endDate: string }>;
				challenges: Challenge[];
				rewards: Reward[];
				userProgress: UserProgress;
			};

			setCurrentEvent({
				...payload.currentEvent,
				startDate: new Date(payload.currentEvent.startDate),
				endDate: new Date(payload.currentEvent.endDate),
			});
			setUpcomingEvents(
				payload.upcomingEvents.map((event) => ({
					...event,
					startDate: new Date(event.startDate),
					endDate: new Date(event.endDate),
				})),
			);
			setChallenges(payload.challenges);
			setRewards(payload.rewards);
			setUserProgress(payload.userProgress);
			setError(null);
		} catch (_err) {
			setError("Failed to load seasonal events");
		} finally {
			setLoading(false);
		}
	}, [_userId]);

	useEffect(() => {
		loadSeasonalEvents();
	}, [loadSeasonalEvents]);

	const joinEvent = async (_eventId: string) => {
		await fetch("/api/platform/seasonal-events", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "join", userId: _userId }),
		});
		await loadSeasonalEvents();
	};

	const completeChallenge = async (challengeId: string) => {
		await fetch("/api/platform/seasonal-events", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "complete", userId: _userId, challengeId }),
		});
		await loadSeasonalEvents();
	};

	const claimReward = async (rewardId: string) => {
		await fetch("/api/platform/seasonal-events", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "claim", userId: _userId, rewardId }),
		});
		await loadSeasonalEvents();
	};

	return {
		currentEvent,
		upcomingEvents,
		userProgress,
		challenges,
		rewards,
		loading,
		error,
		joinEvent,
		completeChallenge,
		claimReward,
	};
}
