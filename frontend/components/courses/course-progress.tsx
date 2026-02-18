import { TrendingUp, Calendar, Award, Target, Rocket, PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CourseProgressProps {
	progress: {
		percentage: number;
		completedLessons: number;
		totalLessons: number;
		timeSpent: string;
		streak: number;
		xpEarned: number;
		xpTotal: number;
		estimatedCompletion: string;
		lastActivity: string;
	};
}

export function CourseProgress({ progress }: CourseProgressProps) {
	const t = useTranslations("courses");

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="h-5 w-5" />
					{t("progress.title")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">{t("progress.courseCompletion")}</span>
						<span className="text-sm text-muted-foreground">
							{progress.percentage}%
						</span>
					</div>
					<Progress value={progress.percentage} className="h-3" />
					<div className="text-sm text-muted-foreground">
						{t("progress.lessonsCompleted", { completed: progress.completedLessons, total: progress.totalLessons })}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="text-center p-3 bg-muted/50 rounded-lg">
						<Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
						<div className="text-lg font-bold">{progress.timeSpent}</div>
						<div className="text-xs text-muted-foreground">{t("progress.timeSpent")}</div>
					</div>

					<div className="text-center p-3 bg-muted/50 rounded-lg">
						<TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
						<div className="text-lg font-bold">{progress.streak}</div>
						<div className="text-xs text-muted-foreground">{t("progress.dayStreak")}</div>
					</div>

					<div className="text-center p-3 bg-muted/50 rounded-lg">
						<Award className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
						<div className="text-lg font-bold">{progress.xpEarned}</div>
						<div className="text-xs text-muted-foreground">{t("progress.xpEarned")}</div>
					</div>

					<div className="text-center p-3 bg-muted/50 rounded-lg">
						<Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
						<div className="text-lg font-bold">{progress.xpTotal}</div>
						<div className="text-xs text-muted-foreground">{t("progress.xpTotal")}</div>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">{t("progress.xpProgress")}</span>
						<Badge variant="secondary">
							{progress.xpEarned} / {progress.xpTotal} XP
						</Badge>
					</div>
					<Progress
						value={(progress.xpEarned / progress.xpTotal) * 100}
						className="h-2"
					/>
				</div>

				<div className="space-y-3 pt-4 border-t">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("progress.lastActivity")}</span>
						<span>{progress.lastActivity}</span>
					</div>

					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("progress.estimatedCompletion")}</span>
						<span>{progress.estimatedCompletion}</span>
					</div>
				</div>

				<div className="flex gap-2">
					<Button className="flex-1" size="sm">
						{t("progress.continueLearning")}
					</Button>
					<Button variant="outline" size="sm">
						{t("progress.viewCertificate")}
					</Button>
				</div>

				{progress.percentage < 100 && (
					<div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
						<div className="text-center">
							<div className="text-sm font-medium text-primary mb-1">
								<span className="inline-flex items-center gap-1">
									{t("progress.keepItUp")} <Rocket className="inline h-4 w-4" />
								</span>
							</div>
							<div className="text-xs text-muted-foreground">
								{t("progress.toGo", { percent: 100 - progress.percentage })}
							</div>
						</div>
					</div>
				)}

				{progress.percentage === 100 && (
					<div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
						<div className="text-center">
							<div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
								<span className="inline-flex items-center gap-1">
									{t("progress.congratulations")} <PartyPopper className="inline h-4 w-4" />
								</span>
							</div>
							<div className="text-xs text-green-700 dark:text-green-300">
								{t("progress.completedCourse")}
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
