import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { LeaderboardStats } from "@/components/leaderboard/leaderboard-stats";
import { UserRankCard } from "@/components/leaderboard/user-rank-card";

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

// Mock data - replace with actual API calls
async function getGlobalLeaderboard() {
	return [
		{
			rank: 1,
			user: {
				id: "user-1",
				name: "João Silva",
				avatar: "/avatars/joao.jpg",
				country: "BR",
			},
			score: 15_420,
			level: 25,
			achievements: 47,
			streak: 45,
			change: 2,
		},
		{
			rank: 2,
			user: {
				id: "user-2",
				name: "Maria Santos",
				avatar: "/avatars/maria.jpg",
				country: "BR",
			},
			score: 14_850,
			level: 24,
			achievements: 43,
			streak: 32,
			change: -1,
		},
		{
			rank: 3,
			user: {
				id: "user-3",
				name: "Carlos Rodriguez",
				avatar: "/avatars/carlos.jpg",
				country: "AR",
			},
			score: 14_200,
			level: 23,
			achievements: 41,
			streak: 28,
			change: 1,
		},
		// Add more entries...
	];
}

async function getWeeklyLeaderboard() {
	return [
		{
			rank: 1,
			user: {
				id: "user-4",
				name: "Ana Costa",
				avatar: "/avatars/ana.jpg",
				country: "PT",
			},
			score: 1250,
			level: 18,
			achievements: 5,
			streak: 7,
			change: 5,
		},
		// Add more entries...
	];
}

async function getMonthlyLeaderboard() {
	return [
		{
			rank: 1,
			user: {
				id: "user-5",
				name: "Pedro Lima",
				avatar: "/avatars/pedro.jpg",
				country: "BR",
			},
			score: 4850,
			level: 22,
			achievements: 18,
			streak: 30,
			change: 3,
		},
		// Add more entries...
	];
}

async function getCourseLeaderboards() {
	return [
		{
			courseId: "solana-fundamentals",
			courseName: "Solana Fundamentals",
			entries: [
				{
					rank: 1,
					user: {
						id: "user-1",
						name: "João Silva",
						avatar: "/avatars/joao.jpg",
						country: "BR",
					},
					score: 1200,
					level: 15,
					achievements: 8,
					streak: 12,
					change: 0,
				},
				// Add more entries...
			],
		},
		{
			courseId: "anchor-masterclass",
			courseName: "Anchor Masterclass",
			entries: [
				{
					rank: 1,
					user: {
						id: "user-2",
						name: "Maria Santos",
						avatar: "/avatars/maria.jpg",
						country: "BR",
					},
					score: 1100,
					level: 14,
					achievements: 7,
					streak: 10,
					change: 1,
				},
				// Add more entries...
			],
		},
	];
}

async function getUserRank() {
	return {
		globalRank: 42,
		weeklyRank: 15,
		monthlyRank: 28,
		score: 8750,
		level: 18,
		achievements: 23,
		streak: 12,
		percentile: 78.5,
	};
}

async function getLeaderboardStats() {
	return {
		totalUsers: 15_420,
		activeThisWeek: 3240,
		totalXP: 2_847_500,
		averageLevel: 12.5,
	};
}
