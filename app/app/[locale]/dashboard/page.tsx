/**
 * @fileoverview Server-side entry point for the User Dashboard.
 * Fetches user statistics, core progress, achievements, and activity feeds.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { syncUserEnrollments } from "@/lib/actions/gamification";
import { auth } from "@/lib/auth";
import { getLatestAchievements } from "@/lib/data/achievements";
import { getActivityFeed, getRecentActivity } from "@/lib/data/activity";
import { syncUserXp } from "@/lib/data/leaderboard";
import {
	getActiveCourses,
	getRecommendedCourses,
	getUserStats,
} from "@/lib/data/user";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/");
	}

	// Track dashboard view
	try {
		const { getPostHogClient } = await import("@/lib/posthog-server");
		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: session.user.id,
			event: "dashboard_viewed",
			properties: {
				user_email: session.user.email,
			},
		});
		await posthog.shutdown();
	} catch (e) {
		console.error("PostHog dashboard tracking failed:", e);
	}

	const userId = session.user.id;

	// Sync on-chain data to DB before fetching dashboard data
	try {
		await Promise.all([syncUserXp(userId), syncUserEnrollments(userId)]);
	} catch (e) {
		console.error("Dashboard sync failed:", e);
	}

	const [
		userStats,
		achievements,
		recentActivity,
		activeCourses,
		recommendedCourses,
		fullHistory,
	] = await Promise.all([
		getUserStats(userId),
		getLatestAchievements(userId),
		getRecentActivity(userId),
		getActiveCourses(userId),
		getRecommendedCourses(userId),
		getActivityFeed(userId, 100),
	]);

	return (
		<DashboardView
			userStats={userStats}
			activeCourses={activeCourses}
			recommendedCourses={recommendedCourses}
			achievements={achievements}
			recentActivity={recentActivity}
			fullHistory={fullHistory}
		/>
	);
}
