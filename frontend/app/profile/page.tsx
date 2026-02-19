import { Suspense } from "react";
import type { Metadata } from "next";

import { ProfileHeader } from "@/components/profile/profile-header";
import { AchievementGrid } from "@/components/profile/achievement-grid";
import { ProgressStats } from "@/components/profile/progress-stats";
import { ActivityFeed } from "@/components/profile/activity-feed";
import { LevelProgress } from "@/components/profile/level-progress";
import { StreakTracker } from "@/components/profile/streak-tracker";
import { CourseProgress } from "@/components/profile/course-progress";
import { PublicKey } from "@solana/web3.js";
import { findToken2022ATA } from "@superteam/solana";
import { fetchIndexedLearnerActivity, getAcademyClient } from "@/lib/academy";
import { getLinkedWallet } from "@/lib/auth";

export const metadata: Metadata = {
	title: "Profile | Superteam Academy",
	description: "View your learning progress, achievements, and statistics",
};

interface ProfilePageProps {
	searchParams?: Promise<{ wallet?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
	const params = searchParams ? await searchParams : undefined;
	const linkedWallet = await getLinkedWallet();
	const wallet = params?.wallet ?? linkedWallet;

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<ProfileSkeleton />}>
				<ProfileContent {...(wallet ? { walletAddress: wallet } : {})} />
			</Suspense>
		</div>
	);
}


async function ProfileContent({ walletAddress }: { walletAddress?: string }) {
	const profile = await getDynamicProfile(walletAddress);
	const { user, stats, achievements, activity, courses } = profile;

	return (
		<div className="mx-auto px-4 sm:px-6 py-8 space-y-6">
			<ProfileHeader user={user} stats={stats} />

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
					<AchievementGrid
						achievements={achievements}
						unlockedCount={stats.achievements.unlocked}
						totalCount={stats.achievements.total}
					/>
				</div>

				<div className="space-y-6">
					<StreakTracker streakData={stats.streak} />
					<ProgressStats stats={stats} />
					<ActivityFeed activities={activity} />
				</div>
			</div>
		</div>
	);
}

function ProfileSkeleton() {
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
					{[120, 180, 220].map((h) => (
						<div key={h} className={`h-[${h}px] bg-muted animate-pulse rounded-2xl`} />
					))}
				</div>
				<div className="space-y-6">
					{[140, 160, 200].map((h) => (
						<div key={h} className={`h-[${h}px] bg-muted animate-pulse rounded-2xl`} />
					))}
				</div>
			</div>
		</div>
	);
}

async function getDynamicProfile(walletAddress?: string) {
	if (!walletAddress) {
		return {
			user: {
				id: "anonymous",
				name: "Connect Wallet",
				email: "",
				avatar: "",
				bio: "Add ?wallet=<public-key> to view on-chain profile data.",
				joinDate: new Date().toISOString(),
				location: "",
				github: "",
				linkedin: "",
				walletAddress: "11111111111111111111111111111111",
			},
			stats: emptyStats(),
			achievements: [],
			activity: [],
			courses: [],
		};
	}

	let learner: PublicKey;
	try {
		learner = new PublicKey(walletAddress);
	} catch {
		return {
			user: {
				id: "invalid-wallet",
				name: "Invalid Wallet",
				email: "",
				avatar: "",
				bio: "Wallet address is invalid. Use a valid Solana public key.",
				joinDate: new Date().toISOString(),
				location: "",
				github: "",
				linkedin: "",
				walletAddress: "11111111111111111111111111111111",
			},
			stats: emptyStats(),
			achievements: [],
			activity: [],
			courses: [],
		};
	}
	const academyClient = getAcademyClient();
	const [config, allCourses, enrollments] = await Promise.all([
		academyClient.fetchConfig(),
		academyClient.fetchAllCourses(),
		academyClient.fetchEnrollmentsForLearner(learner),
	]);
	const indexedActivity = await fetchIndexedLearnerActivity(learner, 20);

	const xpMint = config?.xpMint;
	const xpBalance = xpMint
		? (await academyClient.fetchXpBalance(findToken2022ATA(learner, xpMint))) ?? 0n
		: 0n;

	const coursesByKey = new Map(allCourses.map((course) => [course.pubkey.toBase58(), course.account]));
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
				completedChallenges: 0,
				totalChallenges: 0,
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

	const completedCourses = enrolledCourses.filter((course) => course.status === "completed").length;
	const inProgressCourses = enrolledCourses.filter((course) => course.status === "in_progress").length;
	const totalLessonsCompleted = enrolledCourses.reduce(
		(sum, course) => sum + course.progress.completedLessons,
		0,
	);
	const totalLessons = enrolledCourses.reduce((sum, course) => sum + course.progress.totalLessons, 0);

	const currentXP = Number(xpBalance);
	const level = Math.max(1, Math.floor(currentXP / 500) + 1);
	const baseXP = (level - 1) * 500;
	const xpIntoLevel = currentXP - baseXP;

	const stats = {
		level,
		xp: xpIntoLevel,
		totalXP: currentXP,
		nextLevelXP: 500,
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
		challenges: {
			completed: 0,
			total: 0,
		},
		achievements: {
			unlocked: completedCourses,
			total: Math.max(10, allCourses.length),
		},
		timeSpent: {
			today: 0,
			thisWeek: 0,
			total: totalLessonsCompleted * 10,
		},
		levelHistory: [],
	};

	const achievements = [
		{
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
		},
	];

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

	return {
		user: {
			id: learner.toBase58(),
			name: `Learner ${learner.toBase58().slice(0, 6)}`,
			email: "",
			avatar: "",
			bio: "On-chain academy profile",
			joinDate: enrollments[0]
				? new Date(enrollments[0].account.enrolledAt * 1000).toISOString()
				: new Date().toISOString(),
			location: "",
			github: "",
			linkedin: "",
			walletAddress: learner.toBase58(),
		},
		stats,
		achievements,
		activity,
		courses: enrolledCourses,
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
		challenges: { completed: 0, total: 0 },
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
