import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { LeaderboardStats } from "@/components/leaderboard/leaderboard-stats";
import { UserRankCard } from "@/components/leaderboard/user-rank-card";
import { getAcademyClient } from "@/lib/academy";
import { LeaderboardService } from "@/services/LeaderboardService";

export const metadata: Metadata = {
	title: "Leaderboard | Superteam Academy",
	description:
		"See how you rank against other learners. Compete for top spots and earn recognition.",
};

export default async function LeaderboardPage() {
	const t = await getTranslations("leaderboard");

	return (
		<div className="min-h-screen">
			<div className="border-b border-border/60 noise">
				<div className="mx-auto px-4 sm:px-6 py-10 sm:py-14">
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("title")}</h1>
					<p className="mt-3 text-lg text-muted-foreground max-w-xl">
						{t("description")}
					</p>
				</div>
			</div>

			<div className="mx-auto px-4 sm:px-6 py-8">
				<Suspense fallback={<LeaderboardSkeleton />}>
					<LeaderboardContent />
				</Suspense>
			</div>
		</div>
	);
}

async function LeaderboardContent() {
	const t = await getTranslations("leaderboard");
	const globalLeaderboard = await getGlobalLeaderboard();
	const courseLeaderboards = await getCourseLeaderboards();
	const userRank = await getUserRank();

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
				<div className="lg:col-span-2">
					<UserRankCard userRank={userRank} />
				</div>
				<div>
					<LeaderboardStats stats={await getLeaderboardStats()} />
				</div>
			</div>

			<LeaderboardFilters />

			<Tabs defaultValue="global" className="space-y-5">
				<TabsList className="bg-muted/50 p-1 rounded-xl">
					<TabsTrigger
						value="global"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("tabs.global")}
					</TabsTrigger>
					<TabsTrigger
						value="weekly"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("tabs.weekly")}
					</TabsTrigger>
					<TabsTrigger
						value="monthly"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("tabs.monthly")}
					</TabsTrigger>
					<TabsTrigger
						value="courses"
						className="rounded-lg text-sm data-[state=active]:shadow-sm"
					>
						{t("tabs.courses")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="global">
					<LeaderboardTable
						title={t("global.title")}
						description={t("global.description")}
						entries={globalLeaderboard}
						showPagination
					/>
				</TabsContent>

				<TabsContent value="weekly">
					<LeaderboardTable
						title={t("weekly.title")}
						description={t("weekly.description")}
						entries={await getWeeklyLeaderboard()}
						showPagination
					/>
				</TabsContent>

				<TabsContent value="monthly">
					<LeaderboardTable
						title={t("monthly.title")}
						description={t("monthly.description")}
						entries={await getMonthlyLeaderboard()}
						showPagination
					/>
				</TabsContent>

				<TabsContent value="courses">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						{courseLeaderboards.map((cl) => (
							<LeaderboardTable
								key={cl.courseId}
								title={cl.courseName}
								description={`Top learners in ${cl.courseName}`}
								entries={cl.entries}
								compact
							/>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function LeaderboardSkeleton() {
	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
				<Skeleton className="lg:col-span-2 h-44 rounded-2xl" />
				<Skeleton className="h-44 rounded-2xl" />
			</div>
			<Skeleton className="h-10 w-full max-w-lg rounded-xl" />
			<div className="space-y-3">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-16 rounded-xl" />
				))}
			</div>
		</div>
	);
}

async function getGlobalLeaderboard() {
	const academyClient = getAcademyClient();
	const config = await academyClient.fetchConfig();
	if (!config) return [];

	const service = new LeaderboardService(academyClient.connection, academyClient.programId);
	const entries = await service.getLeaderboard(config.xpMint, 50);

	return entries.map((entry) => {
		const xp = Number(entry.xpBalance);
		return {
			rank: entry.rank,
			user: {
				id: entry.publicKey,
				name: `${entry.publicKey.slice(0, 4)}...${entry.publicKey.slice(-4)}`,
				avatar: "",
				country: "--",
			},
			score: xp,
			level: Math.max(1, Math.floor(xp / 500) + 1),
			achievements: 0,
			streak: 0,
			change: 0,
		};
	});
}

async function getWeeklyLeaderboard() {
	return getGlobalLeaderboard();
}

async function getMonthlyLeaderboard() {
	return getGlobalLeaderboard();
}

async function getCourseLeaderboards() {
	const academyClient = getAcademyClient();
	const courses = await academyClient.fetchAllCourses();
	return courses.slice(0, 4).map((course) => ({
		courseId: course.account.courseId,
		courseName: course.account.courseId,
		entries: [] as Array<{
			rank: number;
			user: { id: string; name: string; avatar?: string; country: string };
			score: number;
			level: number;
			achievements: number;
			streak: number;
			change: number;
		}>,
	}));
}

async function getUserRank() {
	const global = await getGlobalLeaderboard();
	const wallet = process.env.NEXT_PUBLIC_DEFAULT_PROFILE_WALLET;
	const target = wallet ? global.find((entry) => entry.user.id === wallet) : global[0];

	return {
		globalRank: target?.rank ?? 0,
		weeklyRank: target?.rank ?? 0,
		monthlyRank: target?.rank ?? 0,
		score: target?.score ?? 0,
		level: target?.level ?? 1,
		achievements: target?.achievements ?? 0,
		streak: target?.streak ?? 0,
		percentile:
			global.length > 0 && target
				? Math.max(0, (1 - target.rank / global.length) * 100)
				: 0,
	};
}

async function getLeaderboardStats() {
	const global = await getGlobalLeaderboard();
	const totalXP = global.reduce((sum, entry) => sum + entry.score, 0);
	const averageLevel =
		global.length > 0
			? global.reduce((sum, entry) => sum + entry.level, 0) / global.length
			: 0;

	return {
		totalUsers: global.length,
		activeThisWeek: global.length,
		totalXP,
		averageLevel,
	};
}
