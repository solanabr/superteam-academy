/**
 * @fileoverview Main Leaderboard page for Superteam Academy.
 * Fetches rankings and user standing to display the global competition.
 */

import { headers } from "next/headers";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { auth } from "@/lib/auth";
import {
	getLeaderboard,
	getUserStanding,
	syncUserXp,
} from "@/lib/data/leaderboard";

/**
 * Server Component: LeaderboardPage
 * Handles data fetching for the initial leaderboard state.
 */
export default async function LeaderboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Track leaderboard view
	if (session) {
		try {
			const { getPostHogClient } = await import("@/lib/posthog-server");
			const posthog = getPostHogClient();
			posthog.capture({
				distinctId: session.user.id,
				event: "leaderboard_viewed",
				properties: {
					user_email: session.user.email,
				},
			});
			await posthog.shutdown();
		} catch (e) {
			console.error("PostHog leaderboard tracking failed:", e);
		}
	}

	if (session?.user?.id) {
		// Fetch on-chain XP from user's wallet, push to DB, then leaderboard reads from DB
		await syncUserXp(session.user.id);
	}

	const entries = await getLeaderboard();

	const userStanding = session?.user?.id
		? await getUserStanding(session.user.id)
		: null;

	return (
		<LeaderboardView
			initialEntries={entries}
			currentUserId={session?.user?.id}
			userStanding={
				userStanding || {
					globalRank: 0,
					percentile: "N/A",
					xpToFirst: 0,
					rewardsEligible: false,
					xp: 0,
				}
			}
		/>
	);
}
