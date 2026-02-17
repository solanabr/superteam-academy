import { TrendingUp, Calendar, Award, Target, Rocket, PartyPopper } from "lucide-react";

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
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="h-5 w-5" />
					Your Progress
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Course Completion</span>
						<span className="text-sm text-muted-foreground">
							{progress.percentage}%
						</span>
					</div>
					<Progress value={progress.percentage} className="h-3" />
					<div className="text-sm text-muted-foreground">
						{progress.completedLessons} of {progress.totalLessons} lessons completed
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="text-center p-3 bg-muted/50 rounded-lg">
						<Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
						<div className="text-lg font-bold">{progress.timeSpent}</div>
						<div className="text-xs text-muted-foreground">Time Spent</div>
					</div>

					<div className="text-center p-3 bg-muted/50 rounded-lg">
						<TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
						<div className="text-lg font-bold">{progress.streak}</div>
						<div className="text-xs text-muted-foreground">Day Streak</div>
					</div>

					<div className="text-center p-3 bg-muted/50 rounded-lg">
						<Award className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
						<div className="text-lg font-bold">{progress.xpEarned}</div>
						<div className="text-xs text-muted-foreground">XP Earned</div>
					</div>

					<div className="text-center p-3 bg-muted/50 rounded-lg">
						<Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
						<div className="text-lg font-bold">{progress.xpTotal}</div>
						<div className="text-xs text-muted-foreground">XP Total</div>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">XP Progress</span>
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
						<span className="text-muted-foreground">Last Activity:</span>
						<span>{progress.lastActivity}</span>
					</div>

					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Estimated Completion:</span>
						<span>{progress.estimatedCompletion}</span>
					</div>
				</div>

				<div className="flex gap-2">
					<Button className="flex-1" size="sm">
						Continue Learning
					</Button>
					<Button variant="outline" size="sm">
						View Certificate
					</Button>
				</div>

				{progress.percentage < 100 && (
					<div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
						<div className="text-center">
							<div className="text-sm font-medium text-primary mb-1">
								<span className="inline-flex items-center gap-1">
									Keep it up! <Rocket className="inline h-4 w-4" />
								</span>
							</div>
							<div className="text-xs text-muted-foreground">
								{100 - progress.percentage}% to go. You're doing great!
							</div>
						</div>
					</div>
				)}

				{progress.percentage === 100 && (
					<div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
						<div className="text-center">
							<div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
								<span className="inline-flex items-center gap-1">
									Congratulations! <PartyPopper className="inline h-4 w-4" />
								</span>
							</div>
							<div className="text-xs text-green-700 dark:text-green-300">
								You've completed this course. Claim your certificate!
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
