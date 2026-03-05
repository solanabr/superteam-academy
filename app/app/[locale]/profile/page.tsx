/**
 * @fileoverview Server-side page component for rendering the user profile.
 * Handles data fetching, synchronization, and mapping for the profile view.
 */

import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import {
	calculateRealSkillRadar,
	getEnrolledCoursesProgress,
	getUserRealAchievements,
	syncUserEnrollments,
} from "@/lib/actions/gamification";
import { getUserProfileData } from "@/lib/actions/updateProfile";
import { getCurrentUserRank, syncUserXp } from "@/lib/data/leaderboard";
import { getUserStreakHistory } from "@/lib/data/user";

/**
 * ProfilePage Component
 * Fetches user profile, XP, enrollments, and achievements in parallel to render the ProfileView.
 */
export default async function ProfilePage() {
	const dbUser = await getUserProfileData();

	if (!dbUser) {
		redirect("/");
	}

	// Map DB user to UserProfile interface
	const profile = {
		id: dbUser.id,
		username: dbUser.name,
		displayName: dbUser.name,
		walletAddress: dbUser.walletAddress || dbUser.id,
		avatar: dbUser.image || undefined,
		avatarSeed: dbUser.avatarSeed || dbUser.id,
		bio: dbUser.bio || "No bio yet.",
		location: dbUser.location || "Earth",
		enrolledSince: dbUser.createdAt.toLocaleDateString("en-US", {
			month: "short",
			year: "numeric",
		}),
		socialLinks: {
			github: dbUser.github
				? dbUser.github.startsWith("http")
					? dbUser.github
					: `https://github.com/${dbUser.github}`
				: undefined,
			githubHandle: dbUser.github || undefined,
			twitter: dbUser.twitter
				? dbUser.twitter.startsWith("http")
					? dbUser.twitter
					: `https://twitter.com/${dbUser.twitter}`
				: undefined,
			twitterHandle: dbUser.twitter || undefined,
			portfolio: dbUser.website || undefined,
			portfolioDisplay: dbUser.website
				? dbUser.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
				: undefined,
		},
		isPublic: dbUser.publicVisibility,
		reputation: dbUser.totalXp,
		level: dbUser.level,
	};

	// Proactively sync user data
	if (dbUser.walletAddress) {
		await Promise.all([
			syncUserXp(dbUser.id, dbUser.walletAddress),
			syncUserEnrollments(dbUser.id, dbUser.walletAddress),
		]);
	}

	// Parallel fetch real gamification data
	const [achievements, skillRadar, courses, globalRank, streakHistory] =
		await Promise.all([
			getUserRealAchievements(),
			calculateRealSkillRadar(),
			getEnrolledCoursesProgress(),
			getCurrentUserRank(dbUser.id),
			getUserStreakHistory(dbUser.id, 365), // Fetch 1 year of history
		]);

	return (
		<ProfileView
			profile={profile}
			achievements={achievements}
			skillRadar={skillRadar}
			courses={courses}
			globalRank={globalRank}
			streakHistory={streakHistory}
			isOwner={true}
		/>
	);
}
