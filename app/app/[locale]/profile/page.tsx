import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Shield } from "lucide-react";

import { ProfileHeader } from "@/components/profile/profile-header";
import { AchievementGrid } from "@/components/profile/achievement-grid";
import { ProgressStats } from "@/components/profile/progress-stats";
import { ActivityFeed } from "@/components/profile/activity-feed";
import { LevelProgress } from "@/components/profile/level-progress";
import { StreakTracker } from "@/components/profile/streak-tracker";
import { SkillRadarChart } from "@/components/profile/skill-radar-chart";
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
import type { UserPrivacySettings } from "@superteam-academy/cms";
import { getLinkedWallet, serverAuth } from "@/lib/auth";
import { levelFromXP } from "@superteam-academy/gamification";
import { CredentialService } from "@/services/credential-service";
import { AchievementService } from "@/services/achievement-service";
import { ProfileCompleteness } from "@/components/profile/profile-completeness";
import { getUserByUsername, getUserByWallet, getUserByAuthId } from "@/lib/sanity-users";
import { getGravatarUrl } from "@/lib/utils";
import { getLocalizedPageMetadata } from "@/lib/metadata";
import { getCoursesCMS } from "@/lib/cms";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	return getLocalizedPageMetadata(locale, "profile");
}

interface ProfilePageProps {
	searchParams?: Promise<{ wallet?: string; username?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
	const params = searchParams ? await searchParams : undefined;
	const linkedWallet = await getLinkedWallet();

	let walletAddress: string | undefined;
	let sessionUsername: string | undefined;

	if (params?.username) {
		const user = await getUserByUsername(params.username);
		walletAddress = user?.walletAddress;
	} else {
		walletAddress = params?.wallet ?? linkedWallet;
	}

	// When no wallet and no username, try to resolve from the auth session
	if (!walletAddress && !params?.username) {
		const requestHeaders = await headers();
		const session = await serverAuth.api.getSession({ headers: requestHeaders });
		if (session?.user?.id) {
			const sanityUser = await getUserByAuthId(session.user.id);
			walletAddress = sanityUser?.walletAddress ?? undefined;
			sessionUsername = sanityUser?.username ?? undefined;
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<ProfileSkeleton />}>
				<ProfileContent
					walletAddress={walletAddress}
					username={params?.username ?? sessionUsername}
				/>
			</Suspense>
		</div>
	);
}

export async function ProfileContent({
	walletAddress,
	username,
	privacy,
}: {
	walletAddress: string | undefined;
	username?: string | undefined;
	privacy?: UserPrivacySettings;
}) {
	const isPublicView = !!privacy;
	const isPrivateProfile = privacy?.profileVisibility === "private";

	if (isPrivateProfile) {
		return (
			<div className="mx-auto px-4 sm:px-6 py-20 text-center">
				<div className="rounded-2xl border border-border/60 bg-card p-10 max-w-md mx-auto space-y-3">
					<Shield className="h-10 w-10 text-muted-foreground mx-auto" />
					<h2 className="text-xl font-semibold">Private Profile</h2>
					<p className="text-sm text-muted-foreground">
						This user has set their profile to private.
					</p>
				</div>
			</div>
		);
	}

	const { user, stats, achievements, activity, courses, credentials } = await getDynamicProfile(
		walletAddress,
		username
	);

	const showProgress = !isPublicView || privacy?.showProgress !== false;
	const showAchievements = !isPublicView || privacy?.showAchievements !== false;
	const showActivity = !isPublicView || privacy?.showActivity !== false;

	return (
		<div className="mx-auto px-4 sm:px-6 py-8 space-y-6">
			<ProfileHeader user={user} stats={stats} />
			{!isPublicView && <ProfileCompleteness user={user} />}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					{showProgress && (
						<>
							<CourseProgress courses={courses} />
						</>
					)}
					<CredentialList credentials={credentials} />
					{showAchievements && (
						<AchievementGrid
							achievements={achievements}
							unlockedCount={stats.achievements.unlocked}
							totalCount={stats.achievements.total}
						/>
					)}
				</div>

				<div className="space-y-6">
					<StreakTracker walletAddress={walletAddress} />
					{showProgress && (
						<>
							<LevelProgress
								currentLevel={stats.level}
								currentXP={stats.xp}
								nextLevelXP={stats.nextLevelXP}
								totalXP={stats.totalXP}
								levelUpHistory={stats.levelHistory}
							/>
							<SkillRadarChart courses={courses} />
							<ProgressStats stats={stats} walletAddress={walletAddress} />
						</>
					)}
					{showActivity && <ActivityFeed activities={activity} />}
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
	const sanityUserByUsername = username ? await getUserByUsername(username) : null;
	const usernameLinkedWallet = sanityUserByUsername?.linkedAccounts?.find(
		(entry) => entry.provider === "wallet"
	)?.identifier;

	const walletAddress =
		inputWalletAddress ||
		sanityUserByUsername?.walletAddress ||
		usernameLinkedWallet ||
		undefined;

	if (!walletAddress) {
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
	const sanityUser = await getUserByWallet(learner.toBase58());
	const resolvedUser = sanityUserByUsername || sanityUser;
	const gravatarKey = resolvedUser?.email || learner.toBase58();

	const fallbackProfile = {
		user: {
			id: resolvedUser?._id || learner.toBase58(),
			name: resolvedUser?.name || `Learner ${learner.toBase58().slice(0, 6)}`,
			email: resolvedUser?.email || "",
			avatar: resolvedUser?.image || getGravatarUrl(gravatarKey),
			bio: resolvedUser?.bio || "On-chain academy profile",
			joinDate: resolvedUser?._createdAt || new Date().toISOString(),
			location: resolvedUser?.location || "",
			github: resolvedUser?.github || "",
			linkedin: resolvedUser?.linkedin || "",
			username: resolvedUser?.username,
			walletAddress: learner.toBase58(),
		},
		stats: emptyStats(),
		achievements: [] as never[],
		activity: [] as never[],
		courses: [] as never[],
		credentials: [] as never[],
	};

	try {
		return await fetchOnChainProfile(learner, resolvedUser);
	} catch (err) {
		console.error("Failed to fetch on-chain profile data, using fallback:", err);
		return fallbackProfile;
	}
}

async function fetchOnChainProfile(
	learner: PublicKey,
	resolvedUser: Awaited<ReturnType<typeof getUserByWallet>>,
) {
	const academyClient = getAcademyClient();
	const connection = getSolanaConnection();
	const programId = getProgramId();
	const credentialService = new CredentialService(connection, programId);
	const achievementService = new AchievementService(connection, programId);

	const [
		config,
		allCourses,
		enrollments,
		indexedActivity,
		rawCredentials,
		onChainAchievements,
		cmsCourses,
	] = await Promise.all([
		academyClient.fetchConfig(),
		academyClient.fetchAllCourses(),
		academyClient.fetchEnrollmentsForLearner(learner),
		fetchIndexedLearnerActivity(learner, 10),
		credentialService.getCredentialsByOwner(learner),
		achievementService.getLearnerAchievements(learner),
		getCoursesCMS().catch(() => []),
	]);

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
	// Map on-chain courseId → CMS title for friendly display
	const cmsTitleBySlug = new Map(
		(cmsCourses ?? [])
			.filter((c): c is typeof c & { slug: { current: string }; title: string } =>
				!!c?.slug?.current && !!c?.title)
			.map((c) => [c.slug.current, c.title])
	);
	const onChainCourseIds = new Set<string>();
	const enrolledCourses = enrollments.map((entry) => {
		const course = coursesByKey.get(entry.account.course.toBase58());
		const coursePk = entry.account.course.toBase58();
		const courseId = course?.courseId ?? coursePk;
		onChainCourseIds.add(courseId);
		const completedLessons = countBits(entry.account.lessonFlags);
		const totalLessons = course?.lessonCount ?? 0;
		return {
			id: courseId,
			title: cmsTitleBySlug.get(courseId) ?? formatCourseId(courseId),
			instructor: { name: "Superteam" },
			progress: {
				completedLessons,
				totalLessons,
				timeSpent: completedLessons * 10,
			},
			status: entry.account.completedAt
				? ("completed" as const)
				: completedLessons > 0
					? ("in_progress" as const)
					: ("not_started" as const),
			...(entry.account.completedAt
				? { completionDate: new Date(entry.account.completedAt * 1000).toISOString() }
				: {}),
			certificateEarned: Boolean(entry.account.credentialAsset),
		};
	});

	// Merge CMS-tracked enrollments that aren't already present on-chain
	const cmsEnrolled = resolvedUser?.enrolledCourses ?? [];
	for (const slug of cmsEnrolled) {
		if (onChainCourseIds.has(slug)) continue;
		const cmsCourse = (cmsCourses ?? []).find((c) => c?.slug?.current === slug);
		const moduleLessonCount = (cmsCourse?.modules ?? []).reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
		enrolledCourses.push({
			id: slug,
			title: cmsCourse?.title ?? cmsTitleBySlug.get(slug) ?? formatCourseId(slug),
			instructor: { name: "Superteam" },
			progress: { completedLessons: 0, totalLessons: moduleLessonCount, timeSpent: 0 },
			status: "not_started" as const,
			certificateEarned: false,
		});
	}

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
	const level = levelFromXP(currentXP);
	const currentLevelXP = level * level * 100;
	const nextLevelXP = (level + 1) * (level + 1) * 100;
	const xpIntoLevel = currentXP - currentLevelXP;
	type ProfileAchievementCategory =
		| "learning"
		| "streak"
		| "completion"
		| "social"
		| "special";
	type ProfileAchievement = {
		id: string;
		title: string;
		description: string;
		icon: string;
		category: ProfileAchievementCategory;
		rarity: "common" | "rare" | "epic" | "legendary";
		xpReward: number;
		unlockedAt?: string;
		progress?: { current: number; total: number };
	};

	const achievements: ProfileAchievement[] = onChainAchievements.map((a) => ({
		id: a.achievementId,
		title: a.name,
		description: a.earned ? `Earned +${a.xpReward} XP` : `${a.xpReward} XP reward`,
		icon: "award",
		category: "learning",
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
		achievements.push(
			{
				id: "onchain-learner",
				title: "On-Chain Learner",
				description: "Enroll in your first on-chain course",
				icon: "book",
				category: "learning" as const,
				rarity: "common" as const,
				xpReward: 0,
				...(enrolledCourses.length > 0
					? { unlockedAt: new Date().toISOString() }
					: { progress: { current: 0, total: 1 } }),
			},
			{
				id: "first-lesson",
				title: "First Lesson",
				description: "Complete your first lesson",
				icon: "target",
				category: "learning" as const,
				rarity: "common" as const,
				xpReward: 0,
				...(totalLessonsCompleted > 0
					? { unlockedAt: new Date().toISOString() }
					: { progress: { current: totalLessonsCompleted, total: 1 } }),
			},
			{
				id: "course-completer",
				title: "Course Completer",
				description: "Complete your first course",
				icon: "award",
				category: "completion" as const,
				rarity: "rare" as const,
				xpReward: 0,
				...(completedCourses > 0
					? { unlockedAt: new Date().toISOString() }
					: { progress: { current: completedCourses, total: 1 } }),
			},
			{
				id: "credential-earner",
				title: "Credential Earner",
				description: "Earn your first on-chain credential",
				icon: "zap",
				category: "special" as const,
				rarity: "epic" as const,
				xpReward: 0,
				...(credentials.length > 0
					? { unlockedAt: new Date().toISOString() }
					: { progress: { current: credentials.length, total: 1 } }),
			}
		);
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

/** Convert a slug-style courseId like "intro-to-solana" to "Intro To Solana" */
function formatCourseId(courseId: string): string {
	return courseId
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}
