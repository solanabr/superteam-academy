/**
 * @fileoverview TanStack Query hooks for challenges data.
 * Provides client-side caching and synchronization for the challenges listing.
 */
import { useQuery } from "@tanstack/react-query";
import {
	getAllChallenges,
	getUserChallengeHistory,
} from "@/lib/actions/daily-challenge";

/**
 * Hook to fetch all challenges.
 */
export function useChallenges() {
	return useQuery({
		queryKey: ["challenges"],
		queryFn: async () => {
			const data = await getAllChallenges();
			return data;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

/**
 * Hook to fetch current user's challenge submission history.
 */
export function useUserChallengeHistory() {
	return useQuery({
		queryKey: ["user-challenge-history"],
		queryFn: async () => {
			const data = await getUserChallengeHistory();
			return data;
		},
		staleTime: 1000 * 60 * 1, // 1 minute
	});
}
