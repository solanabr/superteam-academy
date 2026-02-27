"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@superteam-academy/i18n/navigation";
import {
	BookOpen,
	Trophy,
	Flame,
	ArrowRight,
	GraduationCap,
	Target,
	TrendingUp,
	Clock,
} from "lucide-react";
import { useConnection } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { calculateLevelFromXP } from "@superteam-academy/gamification";
import { StreakEventType } from "@superteam-academy/gamification/streak-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";
import { useStreak } from "@/hooks/use-streak";
import { LearningProgressService } from "@/services/learning-progress-service";
import {
	getProgramId,
	fetchIndexedLearnerActivity,
	type IndexedLearnerActivity,
} from "@/lib/academy";

interface DashboardStats {
	totalXp: number;
	level: number;
	streak: number;
	freezesAvailable: number;
	nextMilestone: number | null;
	daysToNextMilestone: number;
	coursesEnrolled: number;
	coursesCompleted: number;
	lessonsCompleted: number;
	achievementsUnlocked: number;
}

interface RecentCourse {
	id: string;
	title: string;
	progress: number;
	totalLessons: number;
	completedLessons: number;
}

export default function DashboardPage() {
	const { isAuthenticated, user, wallet } = useAuth();
	const { connection } = useConnection();
	const t = useTranslations("dashboard");
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
	const [recommendedCourses, setRecommendedCourses] = useState<
		{ id: string; title: string; lessonCount: number }[]
	>([]);
	const [activity, setActivity] = useState<IndexedLearnerActivity[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { state, streakData, milestoneData, recordActivity } = useStreak(
		wallet.publicKey?.toBase58()
	);
	const nextMilestone = milestoneData.nextMilestone?.days ?? null;
	const daysToNextMilestone = milestoneData.daysToNextMilestone;

	// Record daily activity on dashboard visit
	useEffect(() => {
		if (wallet.publicKey) {
			recordActivity(StreakEventType.DAILY_LOGIN);
		}
	}, [wallet.publicKey, recordActivity]);

	const loadDashboard = useCallback(async () => {
		if (!wallet.publicKey) {
			setIsLoading(false);
			return;
		}

		const programId = getProgramId();
		const service = new LearningProgressService(connection, programId);
		const overview = await service.getLearnerOverview(wallet.publicKey as PublicKey);
		const totalXp = Number(overview.stats.totalXp);
		const level = calculateLevelFromXP(totalXp);

		const courses: RecentCourse[] = overview.courses.map((course) => {
			const progress =
				course.totalLessons > 0
					? Math.round((course.completedLessons / course.totalLessons) * 100)
					: 0;

			return {
				id: course.courseId,
				title: course.courseId,
				progress,
				totalLessons: course.totalLessons,
				completedLessons: course.completedLessons,
			};
		});

		setStats({
			totalXp,
			level,
			streak: streakData.current,
			freezesAvailable: state.freezesAvailable,
			nextMilestone,
			daysToNextMilestone,
			coursesEnrolled: overview.stats.enrolledCourses,
			coursesCompleted: overview.stats.completedCourses,
			lessonsCompleted: overview.stats.totalLessonsCompleted,
			achievementsUnlocked: overview.achievementsUnlocked,
		});
		setRecentCourses(courses.slice(0, 3));
		setRecommendedCourses(overview.recommendedCourses);

		// Activity feed
		fetchIndexedLearnerActivity(wallet.publicKey as PublicKey, 10)
			.then(setActivity)
			.catch(() => undefined);

		setIsLoading(false);
	}, [
		wallet.publicKey,
		connection,
		streakData.current,
		state.freezesAvailable,
		nextMilestone,
		daysToNextMilestone,
	]);

	useEffect(() => {
		loadDashboard();
	}, [loadDashboard]);

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Card className="max-w-md w-full mx-4">
					<CardContent className="pt-6 text-center space-y-4">
						<GraduationCap className="w-12 h-12 mx-auto text-muted-foreground" />
						<h2 className="text-xl font-semibold">{t("signIn")}</h2>
						<p className="text-muted-foreground">{t("signInDesc")}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading || !stats) {
		return (
			<div className="min-h-screen bg-background">
				<div className="mx-auto px-4 sm:px-6 py-8 space-y-6">
					<div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
						))}
					</div>
					<div className="h-64 bg-muted animate-pulse rounded-xl" />
				</div>
			</div>
		);
	}

	const displayName = user?.name || wallet.publicKey?.toBase58().slice(0, 8) || "Learner";

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto px-4 sm:px-6 py-8 space-y-8">
				<div>
					<h1 className="text-2xl font-bold">{t("welcome", { name: displayName })}</h1>
					<p className="text-muted-foreground mt-1">{t("overview")}</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
					<StatCard
						icon={<TrendingUp className="w-5 h-5" />}
						label={t("totalXp")}
						value={stats.totalXp.toLocaleString()}
						sublabel={t("level", { level: stats.level })}
					/>
					<StatCard
						icon={<Flame className="w-5 h-5" />}
						label={t("currentStreak")}
						value={t("days", { count: stats.streak })}
						sublabel={t("keepGoing")}
					/>
					<StatCard
						icon={<BookOpen className="w-5 h-5" />}
						label={t("courses")}
						value={`${stats.coursesCompleted}/${stats.coursesEnrolled}`}
						sublabel={t("lessonsDone", { count: stats.lessonsCompleted })}
					/>
					<StatCard
						icon={<Clock className="w-5 h-5" />}
						label={t("streakFreezes")}
						value={String(stats.freezesAvailable)}
						sublabel={
							stats.nextMilestone
								? t("nextMilestoneIn", {
										days: stats.daysToNextMilestone,
										milestone: stats.nextMilestone,
									})
								: t("maxMilestoneReached")
						}
					/>
					<StatCard
						icon={<Trophy className="w-5 h-5" />}
						label={t("achievements")}
						value={String(stats.achievementsUnlocked)}
						sublabel={t("unlocked")}
					/>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">{t("yourCourses")}</h2>
						<Button variant="ghost" size="sm" asChild>
							<Link href="/courses">
								{t("browseAll")} <ArrowRight className="w-4 h-4 ml-1" />
							</Link>
						</Button>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{recentCourses.map((course) => (
							<CourseCard key={course.id} course={course} />
						))}
					</div>
				</div>

				<div className="space-y-4">
					<h2 className="text-lg font-semibold">{t("quickActions")}</h2>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
							<Link href="/courses">
								<BookOpen className="w-5 h-5" />
								<span>{t("exploreCourses")}</span>
							</Link>
						</Button>
						<Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
							<Link href="/leaderboard">
								<Trophy className="w-5 h-5" />
								<span>{t("leaderboard")}</span>
							</Link>
						</Button>
						<Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
							<Link href="/certificates">
								<Target className="w-5 h-5" />
								<span>{t("myCredentials")}</span>
							</Link>
						</Button>
					</div>
				</div>

				{recommendedCourses.length > 0 && (
					<div className="space-y-4">
						<h2 className="text-lg font-semibold">{t("recommendedCourses")}</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{recommendedCourses.map((course) => (
								<Card
									key={course.id}
									className="hover:border-primary/50 transition-colors"
								>
									<CardHeader className="pb-2">
										<CardTitle className="text-base">{course.title}</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<p className="text-sm text-muted-foreground">
											{course.lessonCount} lessons
										</p>
										<Button
											variant="outline"
											size="sm"
											className="w-full"
											asChild
										>
											<Link href={`/courses/${course.id}`}>
												{t("startLearning")}
											</Link>
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}

				{activity.length > 0 && (
					<div className="space-y-4">
						<h2 className="text-lg font-semibold">{t("recentActivity")}</h2>
						<Card>
							<CardContent className="pt-4 space-y-3">
								{activity.map((entry) => (
									<div
										key={entry.signature}
										className="flex items-center gap-3 text-sm"
									>
										<Clock className="w-4 h-4 text-muted-foreground shrink-0" />
										<span className="font-medium">
											{entry.instruction.replace(/_/g, " ")}
										</span>
										<span className="text-muted-foreground ml-auto">
											{new Date(entry.timestamp).toLocaleDateString()}
										</span>
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}

function StatCard({
	icon,
	label,
	value,
	sublabel,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	sublabel: string;
}) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
					<div>
						<p className="text-sm text-muted-foreground">{label}</p>
						<p className="text-2xl font-bold">{value}</p>
						<p className="text-xs text-muted-foreground">{sublabel}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function CourseCard({ course }: { course: RecentCourse }) {
	const t = useTranslations("dashboard");

	return (
		<Card className="hover:border-primary/50 transition-colors">
			<CardHeader className="pb-2">
				<CardTitle className="text-base">{course.title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<Progress value={course.progress} className="h-2" />
				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<span>
						{course.completedLessons}/{course.totalLessons} lessons
					</span>
					<span>{course.progress}%</span>
				</div>
				<Button variant="outline" size="sm" className="w-full" asChild>
					<Link href={`/courses/${course.id}`}>
						{course.progress === 0
							? t("startLearning")
							: course.progress === 100
								? t("review")
								: t("continue")}
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
