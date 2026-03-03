"use client";

import { Trophy, Target, Clock, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/utils";

interface LessonProgressProps {
	progress: {
		completedLessons: number;
		totalLessons: number;
		timeSpent: number; // in minutes
		xpEarned: number;
		xpRequired: number;
		achievements: Array<{
			id: string;
			title: string;
			description: string;
			unlocked: boolean;
			icon: string;
		}>;
	};
	currentLesson: {
		id: string;
		title: string;
		progress: number; // 0-100
	};
}

export function LessonProgress({ progress, currentLesson }: LessonProgressProps) {
	const t = useTranslations("lessonProgress");
	const completionPercentage = (progress.completedLessons / progress.totalLessons) * 100;
	const xpPercentage = (progress.xpEarned / progress.xpRequired) * 100;

	const formatTime = formatDuration;

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Target className="h-5 w-5" />
						{t("courseProgress")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<div className="flex justify-between text-sm mb-2">
							<span>{t("lessonsCompleted")}</span>
							<span>
								{progress.completedLessons} / {progress.totalLessons}
							</span>
						</div>
						<Progress value={completionPercentage} className="h-2" />
						<p className="text-xs text-muted-foreground mt-1">
							{t("percentComplete", {
								percent: completionPercentage.toFixed(1),
							})}
						</p>
					</div>

					<div>
						<div className="flex justify-between text-sm mb-2">
							<span>{t("xpEarned")}</span>
							<span>
								{progress.xpEarned} / {progress.xpRequired}
							</span>
						</div>
						<Progress value={xpPercentage} className="h-2" />
						<p className="text-xs text-muted-foreground mt-1">
							{t("percentToNextLevel", { percent: xpPercentage.toFixed(1) })}
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						{t("currentLesson")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div>
							<p className="font-medium text-sm">{currentLesson.title}</p>
							<div className="flex justify-between text-xs text-muted-foreground mt-1">
								<span>{t("progress")}</span>
								<span>{currentLesson.progress.toFixed(1)}%</span>
							</div>
							<Progress value={currentLesson.progress} className="h-1 mt-1" />
						</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Clock className="h-3 w-3" />
							<span>{t("timeSpent", { time: formatTime(progress.timeSpent) })}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Trophy className="h-5 w-5" />
						{t("achievements")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{progress.achievements.map((achievement) => (
							<div
								key={achievement.id}
								className={`flex items-center gap-3 p-3 rounded-lg border ${
									achievement.unlocked
										? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
										: "bg-muted/50"
								}`}
							>
								<div
									className={`text-2xl ${achievement.unlocked ? "" : "grayscale opacity-50"}`}
								>
									{achievement.icon}
								</div>
								<div className="flex-1 min-w-0">
									<p
										className={`font-medium text-sm ${achievement.unlocked ? "text-green-700 dark:text-green-300" : ""}`}
									>
										{achievement.title}
									</p>
									<p className="text-xs text-muted-foreground">
										{achievement.description}
									</p>
								</div>
								{achievement.unlocked && (
									<CheckCircle2 className="h-5 w-5 text-green-500" />
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-2 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold">{progress.xpEarned}</div>
						<p className="text-xs text-muted-foreground">{t("xpEarned")}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="text-2xl font-bold">{formatTime(progress.timeSpent)}</div>
						<p className="text-xs text-muted-foreground">{t("timeSpentLabel")}</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
