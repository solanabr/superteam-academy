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
import { levelFromXP } from "@superteam-academy/gamification";
import { getGravatarUrl, truncateAddress } from "@/lib/utils";
import { getUsersByWallets, ensureSanityUsersExist } from "@/lib/sanity-users";
import { getCoursesIndex, isSanityConfigured } from "@/lib/cms";
import { countCompletedLessons } from "@superteam-academy/anchor";
import { PublicKey } from "@solana/web3.js";
import { getLocalizedPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	return getLocalizedPageMetadata(locale, "leaderboard");
}

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
	const wallets = entries.map((entry) => entry.publicKey);

	await ensureSanityUsersExist(wallets);

	const [activityMap, sanityUsers] = await Promise.all([
		includeActivity
			? getLatestActivityMap(wallets)
			: Promise.resolve(new Map<string, number>()),
		getUsersByWallets(wallets),
	]);

	return entries.map((entry) => {
		const xp = Number(entry.xpBalance);
		const sanityUser = sanityUsers.get(entry.publicKey);
		return {
			rank: entry.rank,
			user: {
				id: entry.publicKey,
				name: sanityUser?.name ?? truncateAddress(entry.publicKey),
				avatar: sanityUser?.image || getGravatarUrl(entry.publicKey),
				country: sanityUser?.location ?? "--",
			},
			score: xp,
			level: levelFromXP(xp),
			achievements: 0,
			streak: 0,
			change: 0,
			lastActiveAt: activityMap.get(entry.publicKey),
		};
	});
}

async function getCourseLeaderboards(includeActivity: boolean) {
	const academyClient = getAcademyClient();
	const [courses, allEnrollments, cmsCourses] = await Promise.all([
		academyClient.fetchAllCourses(),
		academyClient.fetchAllEnrollments(),
		isSanityConfigured ? getCoursesIndex().catch(() => []) : Promise.resolve([]),
	]);
	const leaderboardCourses = [...courses]
		.sort((a, b) => {
			const enrollmentDelta = b.account.totalEnrollments - a.account.totalEnrollments;
			if (enrollmentDelta !== 0) return enrollmentDelta;
			return Number(b.account.createdAt) - Number(a.account.createdAt);
		})
		.slice(0, 4);

	const cmsByCourseId = new Map(cmsCourses.map((c) => [c.slug?.current ?? c._id, c]));

	const results = await Promise.all(
		leaderboardCourses.map(async (course) => {
			const courseId = course.account.courseId;
			const courseKey = course.pubkey.toBase58();
			const xpPerLesson = course.account.xpPerLesson;
			const completionBonusXp =
				Math.floor((course.account.lessonCount * course.account.xpPerLesson) / 2) || 0;

			// Start from enrollments — guaranteed to find all on-chain enrollments
			const courseEnrollments = allEnrollments.filter(
				(e) => e.account.course.toBase58() === courseKey
			);

			const historyStats = await getCourseHistoryStats({
				academyClient,
				coursePubkey: course.pubkey,
			});

			// Keep current enrollment-account wallets when available, then union with historical learners.
			const learnersFromAccounts = await Promise.all(
				courseEnrollments.map((entry) =>
					resolveEnrollmentLearnerWallet({
						programId: academyClient.programId,
						courseId,
						enrollmentPda: entry.pubkey,
					})
				)
			);

			const learnerWallets = [
				...new Set([
					...historyStats.keys(),
					...learnersFromAccounts.filter((wallet): wallet is string => Boolean(wallet)),
				]),
			];

			const learnerEntries = await Promise.all(
				learnerWallets.map(async (wallet) => {
					const enrollment = await academyClient.fetchEnrollment(courseId, new PublicKey(wallet));
					const completed = enrollment
						? countCompletedLessons(enrollment.lessonFlags)
						: (historyStats.get(wallet)?.completedLessons ?? 0);
					const finalized = enrollment
						? Boolean(enrollment.completedAt)
						: (historyStats.get(wallet)?.finalized ?? false);
					return {
						wallet,
						xp: completed * xpPerLesson + (finalized ? completionBonusXp : 0),
					};
				})
			);

			const sorted = learnerEntries.sort((a, b) => b.xp - a.xp).slice(0, 10);

			const courseWallets = sorted.map((e) => e.wallet);
			const [activityMap, sanityUsers] = await Promise.all([
				includeActivity
					? getLatestActivityMap(courseWallets)
					: Promise.resolve(new Map<string, number>()),
				getUsersByWallets(courseWallets),
			]);

			return {
				courseId,
				courseName: cmsByCourseId.get(courseId)?.title ?? courseId,
				entries: sorted.map((entry, index) => {
					const sanityUser = sanityUsers.get(entry.wallet);
					return {
						rank: index + 1,
						user: {
							id: entry.wallet,
							name: sanityUser?.name ?? truncateAddress(entry.wallet),
							avatar: sanityUser?.image || getGravatarUrl(entry.wallet),
							country: sanityUser?.location ?? "--",
						},
						score: entry.xp,
						level: levelFromXP(entry.xp),
						achievements: 0,
						streak: 0,
						change: 0,
						lastActiveAt: activityMap.get(entry.wallet),
					};
				}),
			};
		})
	);

	return results;
}

async function getCourseHistoryStats({
	academyClient,
	coursePubkey,
}: {
	academyClient: ReturnType<typeof getAcademyClient>;
	coursePubkey: PublicKey;
}): Promise<Map<string, { completedLessons: number; finalized: boolean }>> {
	const signatures = await academyClient.connection.getSignaturesForAddress(coursePubkey, {
		limit: 250,
	});

	const learners = new Map<string, { completedLessons: number; finalized: boolean }>();
	const courseKey = coursePubkey.toBase58();

	const ensureLearner = (wallet: string) => {
		const existing = learners.get(wallet);
		if (existing) return existing;
		const created = { completedLessons: 0, finalized: false };
		learners.set(wallet, created);
		return created;
	};

	for (const signature of signatures) {
		if (signature.err) continue;
		const tx = await academyClient.connection.getParsedTransaction(signature.signature, {
			maxSupportedTransactionVersion: 0,
		});
		if (!tx) continue;

		const hasEnrollLog =
			tx.meta?.logMessages?.some((line) => line.includes("Instruction: Enroll")) ?? false;
		const hasCompleteLessonLog =
			tx.meta?.logMessages?.some((line) => line.includes("Instruction: CompleteLesson")) ??
			false;
		const hasFinalizeCourseLog =
			tx.meta?.logMessages?.some((line) => line.includes("Instruction: FinalizeCourse")) ??
			false;
		if (!hasEnrollLog && !hasCompleteLessonLog && !hasFinalizeCourseLog) continue;

		for (const instruction of tx.transaction.message.instructions) {
			if (!("programId" in instruction) || !instruction.programId.equals(academyClient.programId)) {
				continue;
			}
			if (!("accounts" in instruction)) {
				continue;
			}

			if (
				hasEnrollLog &&
				instruction.accounts.length >= 3 &&
				instruction.accounts[0]?.toString() === courseKey
			) {
				const learner = instruction.accounts[2]?.toString();
				if (learner) ensureLearner(learner);
			}

			if (
				hasCompleteLessonLog &&
				instruction.accounts.length >= 4 &&
				instruction.accounts[1]?.toString() === courseKey
			) {
				const learner = instruction.accounts[3]?.toString();
				if (learner) {
					const stats = ensureLearner(learner);
					stats.completedLessons += 1;
				}
			}

			if (
				hasFinalizeCourseLog &&
				instruction.accounts.length >= 4 &&
				instruction.accounts[1]?.toString() === courseKey
			) {
				const learner = instruction.accounts[3]?.toString();
				if (learner) {
					const stats = ensureLearner(learner);
					stats.finalized = true;
				}
			}
		}
	}

	return learners;
}

async function resolveEnrollmentLearnerWallet({
	programId,
	courseId,
	enrollmentPda,
}: {
	programId: PublicKey;
	courseId: string;
	enrollmentPda: PublicKey;
}): Promise<string | null> {
	const academyClient = getAcademyClient();
	const signatureInfos = await academyClient.connection.getSignaturesForAddress(enrollmentPda, {
		limit: 20,
	});

	for (const signatureInfo of signatureInfos) {
		if (signatureInfo.err) continue;

		const tx = await academyClient.connection.getParsedTransaction(signatureInfo.signature, {
			maxSupportedTransactionVersion: 0,
		});
		if (!tx) continue;

		const hasEnrollLog =
			tx.meta?.logMessages?.some((line) => line.includes("Instruction: Enroll")) ?? false;
		if (!hasEnrollLog) continue;

		const message = tx.transaction.message;
		for (const instruction of message.instructions) {
			if (!("programId" in instruction) || !instruction.programId.equals(programId)) {
				continue;
			}
			if (!("accounts" in instruction) || instruction.accounts.length < 3) {
				continue;
			}

			const enrollmentKey = instruction.accounts[1]?.toString();
			if (enrollmentKey !== enrollmentPda.toBase58()) continue;

			const learner = instruction.accounts[2]?.toString();
			if (!learner) continue;

			try {
				const [expectedPda] = PublicKey.findProgramAddressSync(
					[
						Buffer.from("enrollment"),
						Buffer.from(courseId),
						new PublicKey(learner).toBuffer(),
					],
					programId
				);
				if (expectedPda.equals(enrollmentPda)) {
					return learner;
				}
			} catch {
				continue;
			}
		}
	}

	return null;
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
