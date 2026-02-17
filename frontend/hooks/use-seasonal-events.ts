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
			// Mock data - in real app, this would come from API
			const mockCurrentEvent: SeasonalEvent = {
				id: "winter-2024",
				name: "Winter Wonderland Challenge",
				description: "Complete coding challenges and earn winter-themed rewards!",
				type: "winter",
				themes: ["snow", "coding", "winter"],
				startDate: new Date("2024-12-01"),
				endDate: new Date("2024-12-31"),
				totalChallenges: 10,
				participants: 1250,
				status: "active",
			};

			const mockUpcomingEvents: SeasonalEvent[] = [
				{
					id: "summer-2025",
					name: "Summer Coding Festival",
					description: "Beach-themed coding challenges and rewards",
					type: "summer",
					themes: ["beach", "sun", "summer"],
					startDate: new Date("2025-06-01"),
					endDate: new Date("2025-08-31"),
					totalChallenges: 15,
					participants: 0,
					status: "upcoming",
				},
			];

			const mockChallenges: Challenge[] = [
				{
					id: "challenge-1",
					title: "Snowflake Algorithm",
					description: "Implement an algorithm to generate unique snowflake patterns",
					points: 100,
					difficulty: "medium",
					timeLimit: 60,
					completed: false,
				},
				{
					id: "challenge-2",
					title: "Winter Data Structures",
					description: "Solve problems using winter-themed data structures",
					points: 150,
					difficulty: "hard",
					timeLimit: 90,
					completed: true,
				},
			];

			const mockRewards: Reward[] = [
				{
					id: "reward-1",
					name: "Winter Badge",
					description: "Exclusive winter completion badge",
					icon: "trophy",
					claimable: true,
				},
				{
					id: "reward-2",
					name: "Snowflake NFT",
					description: "Unique winter-themed NFT",
					icon: "snowflake",
					claimable: false,
				},
			];

			const mockUserProgress: UserProgress = {
				joined: true,
				completedChallenges: 1,
			};

			setCurrentEvent(mockCurrentEvent);
			setUpcomingEvents(mockUpcomingEvents);
			setChallenges(mockChallenges);
			setRewards(mockRewards);
			setUserProgress(mockUserProgress);
			setError(null);
		} catch (_err) {
			setError("Failed to load seasonal events");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadSeasonalEvents();
	}, [loadSeasonalEvents]);

	const joinEvent = async (_eventId: string) => {
		// Mock implementation
		if (userProgress) {
			setUserProgress({ ...userProgress, joined: true });
		}
	};

	const completeChallenge = async (challengeId: string) => {
		// Mock implementation
		setChallenges((prev) =>
			prev.map((challenge) =>
				challenge.id === challengeId ? { ...challenge, completed: true } : challenge
			)
		);
		if (userProgress) {
			setUserProgress({
				...userProgress,
				completedChallenges: userProgress.completedChallenges + 1,
			});
		}
	};

	const claimReward = async (rewardId: string) => {
		// Mock implementation
		setRewards((prev) =>
			prev.map((reward) =>
				reward.id === rewardId ? { ...reward, claimable: false } : reward
			)
		);
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
