import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { UserRankCard } from "@/components/leaderboard/user-rank-card";
import { getAcademyClient } from "@/lib/academy";
import { LeaderboardService } from "@/services/leaderboard-service";
import { getLinkedWallet } from "@/lib/auth";
import { calculateLevelFromXP } from "@superteam-academy/gamification";

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
			{userRank && <UserRankCard userRank={userRank} />}

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
			level: calculateLevelFromXP(xp),
			achievements: 0,
			streak: 0,
			change: 0,
		};
	});
}

async function getCourseLeaderboards() {
	const academyClient = getAcademyClient();
	const config = await academyClient.fetchConfig();
	const courses = await academyClient.fetchAllCourses();
	if (!config)
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

	const service = new LeaderboardService(academyClient.connection, academyClient.programId);

	const results = await Promise.all(
		courses.slice(0, 4).map(async (course) => {
			const entries = await service.getCourseLeaderboard(course.account.courseId, 10);
			return {
				courseId: course.account.courseId,
				courseName: course.account.courseId,
				entries: entries.map((entry) => {
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
						level: calculateLevelFromXP(xp),
						achievements: 0,
						streak: 0,
						change: 0,
					};
				}),
			};
		})
	);

	return results;
}

async function getUserRank() {
	const global = await getGlobalLeaderboard();
	const linkedWallet = await getLinkedWallet();
	const target = global.find((entry) => entry.user.id === linkedWallet);

	if (!target) return undefined;

	return {
		globalRank: target?.rank ?? 0,
		score: target?.score ?? 0,
		level: target?.level ?? 1,
		achievements: target?.achievements ?? 0,
		streak: target?.streak ?? 0,
		percentile:
			global.length > 0 && target ? Math.max(0, (1 - target.rank / global.length) * 100) : 0,
	};
}
