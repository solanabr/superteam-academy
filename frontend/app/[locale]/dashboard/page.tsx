"use client";

import { useEffect, useState } from "react";
import { Link } from "@superteam-academy/i18n/navigation";
import {
	BookOpen,
	Trophy,
	Flame,
	ArrowRight,
	GraduationCap,
	Target,
	TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";

interface DashboardStats {
	totalXp: number;
	level: number;
	streak: number;
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
	lastAccessed: string;
}

export default function DashboardPage() {
	const { isAuthenticated, user, wallet } = useAuth();
	const t = useTranslations("dashboard");
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function loadDashboard() {
			// In production, these would come from the LearningProgressService
			// querying on-chain enrollment accounts and XP balances.
			setStats({
				totalXp: 2450,
				level: 12,
				streak: 7,
				coursesEnrolled: 5,
				coursesCompleted: 3,
				lessonsCompleted: 32,
				achievementsUnlocked: 15,
			});
			setRecentCourses([
				{
					id: "solana-fundamentals",
					title: "Solana Fundamentals",
					progress: 67,
					totalLessons: 12,
					completedLessons: 8,
					lastAccessed: new Date().toISOString(),
				},
				{
					id: "anchor-masterclass",
					title: "Anchor Framework Masterclass",
					progress: 100,
					totalLessons: 15,
					completedLessons: 15,
					lastAccessed: new Date(Date.now() - 86_400_000 * 6).toISOString(),
				},
				{
					id: "web3-frontend",
					title: "Web3 Frontend Development",
					progress: 0,
					totalLessons: 10,
					completedLessons: 0,
					lastAccessed: new Date(Date.now() - 86_400_000 * 15).toISOString(),
				},
			]);
			setIsLoading(false);
		}
		loadDashboard();
	}, []);

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

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
