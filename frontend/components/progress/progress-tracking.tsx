"use client";

import { BookOpen, Trophy, Target, TrendingUp, Calendar, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface CourseProgress {
	courseId: string;
	courseTitle: string;
	totalLessons: number;
	completedLessons: number;
	totalChallenges: number;
	completedChallenges: number;
	xpEarned: number;
	timeSpent: number; // in minutes
	lastActivity: Date;
	streak: number;
	grade?: string;
}

interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: string;
	unlockedAt: Date;
	rarity: "common" | "rare" | "epic" | "legendary";
}

interface ProgressTrackingProps {
	courses: CourseProgress[];
	achievements: Achievement[];
	totalXP: number;
	currentLevel: number;
	nextLevelXP: number;
	streak: number;
}

export function ProgressTracking({
	courses,
	achievements,
	totalXP,
	currentLevel,
	nextLevelXP,
	streak,
}: ProgressTrackingProps) {
	const t = useTranslations("progress");
	const { toast: _toast } = useToast();

	const overallProgress =
		courses.length > 0
			? courses.reduce((acc, course) => {
					const courseProgress = (course.completedLessons / course.totalLessons) * 100;
					return acc + courseProgress;
				}, 0) / courses.length
			: 0;

	const totalLessons = courses.reduce((acc, course) => acc + course.totalLessons, 0);
	const completedLessons = courses.reduce((acc, course) => acc + course.completedLessons, 0);
	const totalChallenges = courses.reduce((acc, course) => acc + course.totalChallenges, 0);
	const completedChallenges = courses.reduce(
		(acc, course) => acc + course.completedChallenges,
		0
	);
	const totalTimeSpent = courses.reduce((acc, course) => acc + course.timeSpent, 0);

	const formatTime = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
	};

	const getRarityColor = (rarity: string) => {
		switch (rarity) {
			case "common":
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
			case "rare":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
			case "epic":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
			case "legendary":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		}
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
							<BookOpen className="h-5 w-5 text-blue-600" />
							<div>
								<p className="text-2xl font-bold">
									{completedLessons}/{totalLessons}
								</p>
								<p className="text-xs text-muted-foreground">
									{t("lessonsCompleted")}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
							<Target className="h-5 w-5 text-green-600" />
							<div>
								<p className="text-2xl font-bold">
									{completedChallenges}/{totalChallenges}
								</p>
								<p className="text-xs text-muted-foreground">
									{t("challengesCompleted")}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-purple-600" />
							<div>
								<p className="text-2xl font-bold">{totalXP}</p>
								<p className="text-xs text-muted-foreground">{t("totalXP")}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
							<Calendar className="h-5 w-5 text-orange-600" />
							<div>
								<p className="text-2xl font-bold">{streak}</p>
								<p className="text-xs text-muted-foreground">{t("dayStreak")}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Trophy className="h-5 w-5" />
						{t("levelProgress")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-lg font-semibold">
								{t("level")} {currentLevel}
							</span>
							<span className="text-sm text-muted-foreground">
								{totalXP} / {nextLevelXP} XP
							</span>
						</div>
						<Progress value={(totalXP / nextLevelXP) * 100} className="h-3" />
						<p className="text-sm text-muted-foreground">
							{nextLevelXP - totalXP} XP {t("toNextLevel")}
						</p>
					</div>
				</CardContent>
			</Card>

			<Tabs defaultValue="courses" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="courses">{t("courses")}</TabsTrigger>
					<TabsTrigger value="achievements">{t("achievements")}</TabsTrigger>
					<TabsTrigger value="activity">{t("activity")}</TabsTrigger>
				</TabsList>

				<TabsContent value="courses" className="space-y-4">
					<div className="space-y-4">
						{courses.map((course) => (
							<Card key={course.courseId}>
								<CardContent className="pt-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<h3 className="font-semibold">{course.courseTitle}</h3>
											{course.grade && (
												<Badge variant="secondary">{course.grade}</Badge>
											)}
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<div className="flex items-center gap-2 text-sm">
													<BookOpen className="h-4 w-4" />
													<span>
														{course.completedLessons}/
														{course.totalLessons} {t("lessons")}
													</span>
												</div>
												<Progress
													value={
														(course.completedLessons /
															course.totalLessons) *
														100
													}
													className="h-2 mt-1"
												/>
											</div>
											<div>
												<div className="flex items-center gap-2 text-sm">
													<Target className="h-4 w-4" />
													<span>
														{course.completedChallenges}/
														{course.totalChallenges} {t("challenges")}
													</span>
												</div>
												<Progress
													value={
														(course.completedChallenges /
															course.totalChallenges) *
														100
													}
													className="h-2 mt-1"
												/>
											</div>
										</div>

										<div className="flex items-center justify-between text-sm text-muted-foreground">
											<div className="flex items-center gap-1">
												<Clock className="h-4 w-4" />
												{formatTime(course.timeSpent)}
											</div>
											<div className="flex items-center gap-1">
												<TrendingUp className="h-4 w-4" />
												{course.xpEarned} XP
											</div>
											<div className="flex items-center gap-1">
												<Calendar className="h-4 w-4" />
												{course.lastActivity.toLocaleDateString()}
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="achievements" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						{achievements.map((achievement) => (
							<Card key={achievement.id}>
								<CardContent className="pt-6">
									<div className="flex items-start gap-3">
										<div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
											<Trophy className="h-5 w-5 text-yellow-600" />
										</div>
										<div className="flex-1 space-y-2">
											<div className="flex items-center justify-between">
												<h4 className="font-medium">{achievement.title}</h4>
												<Badge
													className={getRarityColor(achievement.rarity)}
												>
													{t(achievement.rarity)}
												</Badge>
											</div>
											<p className="text-sm text-muted-foreground">
												{achievement.description}
											</p>
											<p className="text-xs text-muted-foreground">
												{t("unlocked")}{" "}
												{achievement.unlockedAt.toLocaleDateString()}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="activity" className="space-y-4">
					<Card>
						<CardContent className="pt-6">
							<div className="space-y-4">
								<h3 className="font-semibold">{t("learningStats")}</h3>
								<div className="grid grid-cols-2 gap-4">
									<div className="text-center p-4 bg-muted rounded-lg">
										<div className="text-2xl font-bold text-blue-600">
											{Math.round(overallProgress)}%
										</div>
										<div className="text-sm text-muted-foreground">
											{t("overallProgress")}
										</div>
									</div>
									<div className="text-center p-4 bg-muted rounded-lg">
										<div className="text-2xl font-bold text-green-600">
											{formatTime(totalTimeSpent)}
										</div>
										<div className="text-sm text-muted-foreground">
											{t("totalTime")}
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<h4 className="text-sm font-medium">{t("recentActivity")}</h4>
									<div className="space-y-2">
										{courses
											.sort(
												(a, b) =>
													b.lastActivity.getTime() -
													a.lastActivity.getTime()
											)
											.slice(0, 3)
											.map((course) => (
												<div
													key={course.courseId}
													className="flex items-center gap-3 p-2 bg-muted rounded"
												>
													<CheckCircle className="h-4 w-4 text-green-600" />
													<div className="flex-1">
														<p className="text-sm font-medium">
															{course.courseTitle}
														</p>
														<p className="text-xs text-muted-foreground">
															{course.lastActivity.toLocaleDateString()}
														</p>
													</div>
												</div>
											))}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
