import { Suspense } from "react";
import type { Metadata } from "next";

import { ProfileHeader } from "@/components/profile/profile-header";
import { AchievementGrid } from "@/components/profile/achievement-grid";
import { ProgressStats } from "@/components/profile/progress-stats";
import { ActivityFeed } from "@/components/profile/activity-feed";
import { LevelProgress } from "@/components/profile/level-progress";
import { StreakTrackerConnected } from "@/components/profile/streak-tracker-connected";
import { SkillRadarConnected } from "@/components/profile/skill-radar-connected";
import { CourseProgress } from "@/components/profile/course-progress";
import { CredentialList } from "@/components/credentials/credential-list";
import { PublicKey } from "@solana/web3.js";
import { findToken2022ATA } from "@superteam-academy/solana";
import {
	fetchIndexedLearnerActivity,
	getAcademyClient,
	getSolanaConnection,
	getProgramId,
} from "@/lib/academy";
import { getLinkedWallet } from "@/lib/auth";
import { calculateLevelFromXP } from "@superteam-academy/gamification";
import { CredentialService } from "@/services/credential-service";
import { AchievementService } from "@/services/achievement-service";
import { ProfileCompleteness } from "@/components/profile/profile-completeness";
import { getUserByUsername, getUserByWallet } from "@/lib/sanity-users";
import { getGravatarUrl } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Profile | Superteam Academy",
	description: "View your learning progress, achievements, and statistics",
};

interface ProfilePageProps {
	searchParams?: Promise<{ wallet?: string; username?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
	const params = searchParams ? await searchParams : undefined;
	const linkedWallet = await getLinkedWallet();

	// Priority: username > wallet > linkedWallet
	let walletAddress: string | undefined;

	if (params?.username) {
		// Look up user by username to get wallet address
		const user = await getUserByUsername(params.username);
		walletAddress = user?.walletAddress;
	} else {
		walletAddress = params?.wallet ?? linkedWallet;
	}

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<ProfileSkeleton />}>
				<ProfileContent walletAddress={walletAddress} username={params?.username} />
			</Suspense>
		</div>
	);
}

export async function ProfileContent({
	walletAddress,
	username,
}: {
	walletAddress: string | undefined;
	username?: string | undefined;
}) {
	const { user, stats, achievements, activity, courses, credentials } = await getDynamicProfile(
		walletAddress,
		username
	);

	return (
		<div className="mx-auto px-4 sm:px-6 py-8 space-y-6">
			<ProfileHeader user={user} stats={stats} />
			<ProfileCompleteness user={user} />

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<LevelProgress
						currentLevel={stats.level}
						currentXP={stats.xp}
						nextLevelXP={stats.nextLevelXP}
						totalXP={stats.totalXP}
						levelUpHistory={stats.levelHistory}
					/>
					<CourseProgress courses={courses} />
					<CredentialList credentials={credentials} />
					<AchievementGrid
						achievements={achievements}
						unlockedCount={stats.achievements.unlocked}
						totalCount={stats.achievements.total}
					/>
				</div>

				<div className="space-y-6">
					<StreakTrackerConnected walletAddress={walletAddress} />
					<SkillRadarConnected courses={courses} />
					<ProgressStats stats={stats} walletAddress={walletAddress} />
					<ActivityFeed activities={activity} />
				</div>
			</div>
		</div>
	);
}

export function ProfileSkeleton() {
	return (
		<div className="mx-auto px-4 sm:px-6 py-8 space-y-6">
			<div className="rounded-2xl border border-border/60 p-6">
				<div className="flex items-center gap-5">
					<div className="h-16 w-16 bg-muted animate-pulse rounded-full" />
					<div className="space-y-2 flex-1">
						<div className="h-5 w-40 bg-muted animate-pulse rounded-lg" />
						<div className="h-4 w-28 bg-muted animate-pulse rounded-lg" />
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<div className="h-30 bg-muted animate-pulse rounded-2xl" />
					<div className="h-45 bg-muted animate-pulse rounded-2xl" />
					<div className="h-55 bg-muted animate-pulse rounded-2xl" />
				</div>
				<div className="space-y-6">
					<div className="h-35 bg-muted animate-pulse rounded-2xl" />
					<div className="h-40 bg-muted animate-pulse rounded-2xl" />
					<div className="h-50 bg-muted animate-pulse rounded-2xl" />
				</div>
			</div>
		</div>
	);
}

async function getDynamicProfile(inputWalletAddress?: string, username?: string) {
	// Look up Sanity user by username if provided
	const sanityUserByUsername = username ? await getUserByUsername(username) : null;

	// If no wallet provided, try to get it from the Sanity user
	const walletAddress = inputWalletAddress || sanityUserByUsername?.walletAddress || undefined;

	if (!walletAddress) {
		// No wallet at all — show Sanity-only profile or anonymous fallback
		const gravatarKey = sanityUserByUsername?.email || "anonymous";
		return {
			user: {
				id: sanityUserByUsername?._id || "anonymous",
				name: sanityUserByUsername?.name || "Connect Wallet",
				email: sanityUserByUsername?.email || "",
				avatar: sanityUserByUsername?.image || getGravatarUrl(gravatarKey),
				bio: sanityUserByUsername?.bio || "Connect a wallet to view on-chain profile data.",
				joinDate: sanityUserByUsername?._createdAt || new Date().toISOString(),
				location: sanityUserByUsername?.location || "",
				github: sanityUserByUsername?.github || "",
				linkedin: sanityUserByUsername?.linkedin || "",
				username: sanityUserByUsername?.username,
				walletAddress: sanityUserByUsername?.walletAddress || "",
			},
			stats: emptyStats(),
			achievements: [],
			activity: [],
			courses: [],
			credentials: [],
		};
	}

	let learner: PublicKey;
	try {
		learner = new PublicKey(walletAddress);
	} catch {
		// Invalid wallet address — show Sanity-only profile if available
		const resolved = sanityUserByUsername;
		const gravatarKey = resolved?.email || "unknown";
		return {
			user: {
				id: resolved?._id || "unknown",
				name: resolved?.name || "Unknown User",
				email: resolved?.email || "",
				avatar: resolved?.image || getGravatarUrl(gravatarKey),
				bio: resolved?.bio || "",
				joinDate: resolved?._createdAt || new Date().toISOString(),
				location: resolved?.location || "",
				github: resolved?.github || "",
				linkedin: resolved?.linkedin || "",
				username: resolved?.username,
				walletAddress: resolved?.walletAddress || "",
			},
			stats: emptyStats(),
			achievements: [],
			activity: [],
			courses: [],
			credentials: [],
		};
	}
	const academyClient = getAcademyClient();
	const connection = getSolanaConnection();
	const programId = getProgramId();
	const credentialService = new CredentialService(connection, programId);
	const achievementService = new AchievementService(connection, programId);

	// Fetch everything in parallel — these are all independent
	const [
		config,
		allCourses,
		enrollments,
		indexedActivity,
		rawCredentials,
		onChainAchievements,
		sanityUser,
	] = await Promise.all([
		academyClient.fetchConfig(),
		academyClient.fetchAllCourses(),
		academyClient.fetchEnrollmentsForLearner(learner),
		fetchIndexedLearnerActivity(learner, 10),
		credentialService.getCredentialsByOwner(learner),
		achievementService.getLearnerAchievements(learner),
		getUserByWallet(learner.toBase58()),
	]);

	// Second pass: things that depend on first pass results
	const [credentials, xpBalance] = await Promise.all([
		Promise.all(
			rawCredentials.map(async (cred) => {
				const metadata = await credentialService.getCredentialMetadata(cred.id);
				return {
					id: cred.id,
					title: metadata.name,
					description: metadata.description,
					imageUrl: metadata.image,
					track: cred.track,
					issuedAt: cred.issuedAt,
					totalXp: cred.totalXp,
					metadataUri: cred.metadataUri,
					isActive: cred.isActive,
				};
			})
		),
		config?.xpMint
			? academyClient
					.fetchXpBalance(findToken2022ATA(learner, config.xpMint))
					.then((b) => b ?? 0n)
			: Promise.resolve(0n),
	]);

	const coursesByKey = new Map(
		allCourses.map((course) => [course.pubkey.toBase58(), course.account])
	);
	const enrolledCourses = enrollments.map((entry) => {
		const course = coursesByKey.get(entry.account.course.toBase58());
		const completedLessons = countBits(entry.account.lessonFlags);
		const totalLessons = course?.lessonCount ?? 0;
		return {
			id: course?.courseId ?? entry.pubkey.toBase58(),
			title: course?.courseId ?? "Course",
			description: "On-chain course progress",
			thumbnail: "/courses/default.jpg",
			instructor: { name: "Superteam", avatar: "" },
			progress: {
				completedLessons,
				totalLessons,
				timeSpent: completedLessons * 10,
				...(entry.account.enrolledAt
					? { lastAccessed: new Date(entry.account.enrolledAt * 1000).toISOString() }
					: {}),
			},
			status: entry.account.completedAt
				? ("completed" as const)
				: completedLessons > 0
					? ("in_progress" as const)
					: ("not_started" as const),
			enrollmentDate: entry.account.enrolledAt
				? new Date(entry.account.enrolledAt * 1000).toISOString()
				: new Date().toISOString(),
			...(entry.account.completedAt
				? { completionDate: new Date(entry.account.completedAt * 1000).toISOString() }
				: {}),
			certificateEarned: Boolean(entry.account.credentialAsset),
		};
	});

	const completedCourses = enrolledCourses.filter(
		(course) => course.status === "completed"
	).length;
	const inProgressCourses = enrolledCourses.filter(
		(course) => course.status === "in_progress"
	).length;
	const totalLessonsCompleted = enrolledCourses.reduce(
		(sum, course) => sum + course.progress.completedLessons,
		0
	);
	const totalLessons = enrolledCourses.reduce(
		(sum, course) => sum + course.progress.totalLessons,
		0
	);

	const currentXP = Number(xpBalance);
	const level = calculateLevelFromXP(currentXP);
	const currentLevelXP = level * level * 100;
	const nextLevelXP = (level + 1) * (level + 1) * 100;
	const xpIntoLevel = currentXP - currentLevelXP;

	const achievements = onChainAchievements.map((a) => ({
		id: a.achievementId,
		title: a.name,
		description: a.earned ? `Earned +${a.xpReward} XP` : `${a.xpReward} XP reward`,
		icon: "award",
		category: "learning" as const,
		rarity: (a.xpReward >= 5000
			? "legendary"
			: a.xpReward >= 2500
				? "epic"
				: a.xpReward >= 1000
					? "rare"
					: "common") as "common" | "rare" | "epic" | "legendary",
		xpReward: a.xpReward,
		...(a.earned && a.awardedAt
			? { unlockedAt: new Date(a.awardedAt * 1000).toISOString() }
			: { progress: { current: 0, total: 1 } }),
	}));

	if (achievements.length === 0) {
		achievements.push({
			id: "onchain-learner",
			title: "On-Chain Learner",
			description: "Enrolled in at least one on-chain course",
			icon: "book",
			category: "learning" as const,
			rarity: "common" as const,
			xpReward: 0,
			...(enrolledCourses.length > 0
				? { unlockedAt: new Date().toISOString() }
				: { progress: { current: 0, total: 1 } }),
		});
	}

	const unlockedCount = achievements.filter((a) => "unlockedAt" in a).length;

	const stats = {
		level,
		xp: xpIntoLevel,
		totalXP: currentXP,
		nextLevelXP: nextLevelXP - currentLevelXP,
		streak: {
			current: 0,
			longest: 0,
			lastActivity: "",
			streakHistory: [],
			weeklyGoal: 7,
			thisWeekActivities: 0,
		},
		courses: {
			completed: completedCourses,
			enrolled: enrolledCourses.length,
			inProgress: inProgressCourses,
		},
		lessons: {
			completed: totalLessonsCompleted,
			total: totalLessons,
		},
		achievements: {
			unlocked: unlockedCount,
			total: Math.max(achievements.length, allCourses.length),
		},
		timeSpent: {
			today: 0,
			thisWeek: 0,
			total: totalLessonsCompleted * 10,
		},
		levelHistory: [],
	};

	const activity = indexedActivity.map((entry) => ({
		id: entry.signature,
		type: "lesson_completed" as const,
		title: `On-chain ${entry.instruction}`,
		description: `Transaction ${entry.signature.slice(0, 8)}...${entry.signature.slice(-8)}`,
		timestamp: entry.timestamp,
		xpGained: 0,
		metadata: {
			lessonName: `${entry.instruction} @ slot ${entry.slot}`,
		},
	}));

	// Prefer username-fetched Sanity user over wallet-fetched one
	const resolvedUser = sanityUserByUsername || sanityUser;
	const gravatarKey = resolvedUser?.email || learner.toBase58();

	return {
		user: {
			id: resolvedUser?._id || learner.toBase58(),
			name: resolvedUser?.name || `Learner ${learner.toBase58().slice(0, 6)}`,
			email: resolvedUser?.email || "",
			avatar: resolvedUser?.image || getGravatarUrl(gravatarKey),
			bio: resolvedUser?.bio || "On-chain academy profile",
			joinDate: enrollments[0]
				? new Date(enrollments[0].account.enrolledAt * 1000).toISOString()
				: resolvedUser?._createdAt || new Date().toISOString(),
			location: resolvedUser?.location || "",
			github: resolvedUser?.github || "",
			linkedin: resolvedUser?.linkedin || "",
			username: resolvedUser?.username,
			walletAddress: learner.toBase58(),
		},
		stats,
		achievements,
		activity,
		courses: enrolledCourses,
		credentials,
	};
}

function emptyStats() {
	return {
		level: 1,
		xp: 0,
		totalXP: 0,
		nextLevelXP: 500,
		streak: {
			current: 0,
			longest: 0,
			lastActivity: "",
			streakHistory: [],
			weeklyGoal: 7,
			thisWeekActivities: 0,
		},
		courses: { completed: 0, enrolled: 0, inProgress: 0 },
		lessons: { completed: 0, total: 0 },
		achievements: { unlocked: 0, total: 10 },
		timeSpent: { today: 0, thisWeek: 0, total: 0 },
		levelHistory: [],
	};
}

function countBits(flags: [bigint, bigint, bigint, bigint]): number {
	let total = 0;
	for (const word of flags) {
		let value = word;
		while (value > 0n) {
			total += Number(value & 1n);
			value >>= 1n;
		}
	}
	return total;
}
