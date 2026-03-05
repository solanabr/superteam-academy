import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { RestrictedProfile } from "@/components/profile/RestrictedProfile";
import {
	calculateRealSkillRadar,
	getEnrolledCoursesProgress,
	getUserRealAchievements,
} from "@/lib/actions/gamification";
import { getPublicProfileData } from "@/lib/actions/updateProfile";
import { getSessionServer } from "@/lib/auth/server";
import { getCurrentUserRank } from "@/lib/data/leaderboard";
import { getUserStreakHistory, UserProfile } from "@/lib/data/user";

export default async function PublicProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;
	const session = await getSessionServer();

	// 1. Fetch the User Profile by "username" (wallet address in our current logic)
	const dbUser = await getPublicProfileData(username);

	if (!dbUser) {
		notFound();
	}

	const isOwner = session?.user?.id === dbUser.id;

	// 3. Handle Private Profile
	if (!dbUser.publicVisibility && !isOwner) {
		return <RestrictedProfile />;
	}

	// 4. Fetch associated gamification data
	const [achievements, skillRadar, courses, globalRank, streakHistory] =
		await Promise.all([
			getUserRealAchievements(dbUser.id),
			calculateRealSkillRadar(dbUser.id),
			getEnrolledCoursesProgress(dbUser.id),
			getCurrentUserRank(dbUser.id),
			getUserStreakHistory(dbUser.id, 365), // Fetch 1 year of history
		]);

	// Map DB User to UserProfile interface
	const profile: UserProfile = {
		id: dbUser.id,
		username: dbUser.walletAddress || dbUser.id, // Fallback to ID if wallet is missing
		displayName: dbUser.name || "Anonymous Operator",
		walletAddress: dbUser.walletAddress || dbUser.id,
		bio: dbUser.bio || undefined,
		location: dbUser.location || undefined,
		avatarSeed: dbUser.avatarSeed || undefined,
		enrolledSince: dbUser.createdAt.toLocaleDateString("en-US", {
			month: "short",
			year: "numeric",
		}),
		socialLinks: {
			github: dbUser.github || undefined,
			twitter: dbUser.twitter || undefined,
			portfolio: dbUser.website || undefined,
		},
		isPublic: dbUser.publicVisibility,
		level: dbUser.level,
	};

	return (
		<ProfileView
			profile={profile}
			achievements={achievements}
			skillRadar={skillRadar}
			courses={courses}
			globalRank={globalRank}
			streakHistory={streakHistory}
			isOwner={isOwner}
		/>
	);
}
