import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import {
	DEFAULT_FILTERS,
	LeaderboardFilters,
	type FilterState,
} from "@/components/leaderboard/leaderboard-filters";
import { UserRankCard } from "@/components/leaderboard/user-rank-card";
import { getAcademyClient } from "@/lib/academy";
import { LeaderboardService } from "@/services/leaderboard-service";
import { getLinkedWallet } from "@/lib/auth";
import { calculateLevelFromXP } from "@superteam-academy/gamification";
import { getGravatarUrl } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";

export const metadata: Metadata = {
	title: "Leaderboard | Superteam Academy",
	description:
		"See how you rank against other learners. Compete for top spots and earn recognition.",
};

interface LeaderboardPageProps {
	searchParams: Promise<{
		q?: string;
		country?: string;
		level?: string;
		sort?: string;
		time?: string;
	}>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
	const t = await getTranslations("leaderboard");
	const resolvedSearchParams = await searchParams;
	const filters = parseFilters(resolvedSearchParams);

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
					<LeaderboardContent filters={filters} />
				</Suspense>
			</div>
		</div>
	);
}

async function LeaderboardContent({ filters }: { filters: FilterState }) {
	const t = await getTranslations("leaderboard");
	const needsActivityWindow = filters.timePeriod !== "all-time";
	const globalLeaderboardRaw = await getGlobalLeaderboard(needsActivityWindow);
	const courseLeaderboardsRaw = await getCourseLeaderboards(needsActivityWindow);

	const globalLeaderboard = applyLeaderboardFilters(globalLeaderboardRaw, filters);
	const courseLeaderboards = courseLeaderboardsRaw
		.map((leaderboard) => ({
			...leaderboard,
			entries: applyLeaderboardFilters(leaderboard.entries, filters),
		}))
		.filter((leaderboard) => leaderboard.entries.length > 0 || !filters.search);
	const userRank = await getUserRank(globalLeaderboard);

	return (
		<div className="space-y-8">
			{userRank && <UserRankCard userRank={userRank} />}

			<LeaderboardFilters filters={filters} />

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

type DisplayLeaderboardEntry = {
	rank: number;
	user: {
		id: string;
		name: string;
		avatar?: string;
		country: string;
	};
	score: number;
	level: number;
	achievements: number;
	streak: number;
	change: number;
	lastActiveAt?: number;
};

function parseFilters(searchParams: Awaited<LeaderboardPageProps["searchParams"]>): FilterState {
	const sort = searchParams.sort;
	const time = searchParams.time;

	return {
		search: searchParams.q?.trim() ?? DEFAULT_FILTERS.search,
		country: searchParams.country ?? DEFAULT_FILTERS.country,
		level: searchParams.level ?? DEFAULT_FILTERS.level,
		sortBy:
			sort === "level" || sort === "achievements" || sort === "streak" || sort === "score"
				? sort
				: DEFAULT_FILTERS.sortBy,
		timePeriod:
			time === "weekly" || time === "monthly" || time === "all-time"
				? time
				: DEFAULT_FILTERS.timePeriod,
	};
}

function parseLevelRange(range: string): { min: number; max: number } | null {
	if (!range) return null;

	if (range.endsWith("+")) {
		const min = Number.parseInt(range.replace("+", ""), 10);
		if (Number.isNaN(min)) return null;
		return { min, max: Number.POSITIVE_INFINITY };
	}

	const [minRaw, maxRaw] = range.split("-");
	const min = Number.parseInt(minRaw, 10);
	const max = Number.parseInt(maxRaw, 10);

	if (Number.isNaN(min) || Number.isNaN(max)) return null;
	return { min, max };
}

function applyLeaderboardFilters(
	entries: DisplayLeaderboardEntry[],
	filters: FilterState
): DisplayLeaderboardEntry[] {
	let filtered = [...entries];

	if (filters.search) {
		const query = filters.search.toLowerCase();
		filtered = filtered.filter(
			(entry) =>
				entry.user.name.toLowerCase().includes(query) ||
				entry.user.id.toLowerCase().includes(query)
		);
	}

	if (filters.country) {
		filtered = filtered.filter((entry) => entry.user.country === filters.country);
	}

	if (filters.level) {
		const range = parseLevelRange(filters.level);
		if (range) {
			filtered = filtered.filter(
				(entry) => entry.level >= range.min && entry.level <= range.max
			);
		}
	}

	if (filters.timePeriod !== "all-time") {
		const now = Date.now();
		const windowStart =
			filters.timePeriod === "weekly"
				? now - 7 * 24 * 60 * 60 * 1000
				: now - 30 * 24 * 60 * 60 * 1000;
		filtered = filtered.filter(
			(entry) => typeof entry.lastActiveAt === "number" && entry.lastActiveAt >= windowStart
		);
	}

	const sorted = [...filtered].sort((a, b) => {
		if (filters.sortBy === "level") {
			return b.level - a.level || b.score - a.score;
		}

		if (filters.sortBy === "achievements") {
			return b.achievements - a.achievements || b.score - a.score;
		}

		if (filters.sortBy === "streak") {
			return b.streak - a.streak || b.score - a.score;
		}

		return b.score - a.score;
	});

	return sorted.map((entry, index) => ({
		...entry,
		rank: index + 1,
	}));
}

async function getLatestActivityMap(addresses: string[]) {
	if (addresses.length === 0) return new Map<string, number>();

	const academyClient = getAcademyClient();
	const activityPairs = await Promise.all(
		addresses.map(async (address) => {
			try {
				const signatures = await academyClient.connection.getSignaturesForAddress(
					new PublicKey(address),
					{ limit: 1 }
				);
				const latest = signatures[0]?.blockTime;
				return [address, latest ? latest * 1000 : null] as const;
			} catch {
				return [address, null] as const;
			}
		})
	);

	return new Map<string, number>(
		activityPairs
			.filter((pair): pair is readonly [string, number] => typeof pair[1] === "number")
			.map(([address, timestamp]) => [address, timestamp])
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

async function getGlobalLeaderboard(includeActivity: boolean) {
	const academyClient = getAcademyClient();
	const config = await academyClient.fetchConfig();
	if (!config) return [];

	const service = new LeaderboardService(academyClient.connection, academyClient.programId);
	const entries = await service.getLeaderboard(config.xpMint, 50);
	const activityMap = includeActivity
		? await getLatestActivityMap(entries.map((entry) => entry.publicKey))
		: new Map<string, number>();

	return entries.map((entry) => {
		const xp = Number(entry.xpBalance);
		return {
			rank: entry.rank,
			user: {
				id: entry.publicKey,
				name: `${entry.publicKey.slice(0, 4)}...${entry.publicKey.slice(-4)}`,
				avatar: getGravatarUrl(entry.publicKey),
				country: "--",
			},
			score: xp,
			level: calculateLevelFromXP(xp),
			achievements: 0,
			streak: 0,
			change: 0,
			lastActiveAt: activityMap.get(entry.publicKey),
		};
	});
}

async function getCourseLeaderboards(includeActivity: boolean) {
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
			const activityMap = includeActivity
				? await getLatestActivityMap(entries.map((entry) => entry.publicKey))
				: new Map<string, number>();
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
							avatar: getGravatarUrl(entry.publicKey),
							country: "--",
						},
						score: xp,
						level: calculateLevelFromXP(xp),
						achievements: 0,
						streak: 0,
						change: 0,
						lastActiveAt: activityMap.get(entry.publicKey),
					};
				}),
			};
		})
	);

	return results;
}

async function getUserRank(global: DisplayLeaderboardEntry[]) {
	const linkedWallet = await getLinkedWallet();
	const target = global.find((entry) => entry.user.id === linkedWallet);

	if (!target) return undefined;

	return {
		globalRank: target?.rank ?? 0,
		score: target?.score ?? 0,
		achievements: target?.achievements ?? 0,
		streak: target?.streak ?? 0,
		percentile:
			global.length > 0 && target ? Math.max(0, (1 - target.rank / global.length) * 100) : 0,
	};
}
