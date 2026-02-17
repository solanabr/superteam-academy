"use client";

import { CheckCircle, XCircle, RotateCcw, Trophy, Award, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";

interface SubmissionResult {
	passed: boolean;
	score: number;
	maxScore: number;
	executionTime: number;
	testsPassed: number;
	totalTests: number;
	feedback: string[];
	xpEarned: number;
	achievements?: string[];
	nextChallenge?: {
		id: string;
		title: string;
	};
}

interface ChallengeResultsProps {
	results: SubmissionResult | null;
	onRetry: () => void;
}

export function ChallengeResults({ results, onRetry }: ChallengeResultsProps) {
	const t = useTranslations("challenges");

	if (!results) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<Target className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium mb-2">{t("results.noResults")}</h3>
					<p className="text-muted-foreground text-center">{t("results.submitToSee")}</p>
				</CardContent>
			</Card>
		);
	}

	const scorePercentage = (results.score / results.maxScore) * 100;
	const testsPercentage = (results.testsPassed / results.totalTests) * 100;

	return (
		<div className="space-y-6">
			<Card
				className={
					results.passed
						? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
						: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
				}
			>
				<CardHeader>
					<CardTitle className="flex items-center gap-3">
						{results.passed ? (
							<CheckCircle className="h-6 w-6 text-green-500" />
						) : (
							<XCircle className="h-6 w-6 text-red-500" />
						)}
						{results.passed ? t("results.passed") : t("results.failed")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold">{results.score}</div>
							<div className="text-xs text-muted-foreground">
								{t("results.score")}
							</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold">{results.testsPassed}</div>
							<div className="text-xs text-muted-foreground">
								{t("results.testsPassed")}
							</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold">{results.executionTime}ms</div>
							<div className="text-xs text-muted-foreground">
								{t("results.executionTime")}
							</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								+{results.xpEarned}
							</div>
							<div className="text-xs text-muted-foreground">
								{t("results.xpEarned")}
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>{t("results.overallScore")}</span>
							<span>{Math.round(scorePercentage)}%</span>
						</div>
						<Progress value={scorePercentage} className="h-2" />
					</div>

					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>{t("results.testsPassed")}</span>
							<span>{Math.round(testsPercentage)}%</span>
						</div>
						<Progress value={testsPercentage} className="h-2" />
					</div>
				</CardContent>
			</Card>

			{results.feedback.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t("results.feedback")}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{results.feedback.map((item, index) => (
								<div key={index} className="flex items-start gap-3">
									<div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
									<p className="text-sm">{item}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{results.achievements && results.achievements.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Trophy className="h-5 w-5 text-yellow-500" />
							{t("results.achievements")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{results.achievements.map((achievement, index) => (
								<div key={index} className="flex items-center gap-3">
									<Award className="h-4 w-4 text-yellow-500" />
									<span className="text-sm font-medium">{achievement}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>{t("results.nextSteps")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{results.nextChallenge ? (
						<div className="space-y-3">
							<p className="text-sm text-muted-foreground">
								{t("results.greatJob")} {t("results.tryNext")}
							</p>
							<div className="flex items-center justify-between p-3 border rounded-lg">
								<div>
									<h4 className="font-medium">{results.nextChallenge.title}</h4>
									<p className="text-sm text-muted-foreground">
										{t("results.nextChallenge")}
									</p>
								</div>
								<Button asChild={true}>
									<a href={`/courses/challenge/${results.nextChallenge.id}`}>
										{t("results.continue")}
									</a>
								</Button>
							</div>
						</div>
					) : (
						<div className="text-center py-4">
							<Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
							<p className="text-sm text-muted-foreground">
								{t("results.completedAll")}
							</p>
						</div>
					)}

					{!results.passed && (
						<div className="flex gap-2">
							<Button onClick={onRetry} className="flex-1 gap-2">
								<RotateCcw className="h-4 w-4" />
								{t("results.tryAgain")}
							</Button>
							<Button variant="outline" asChild={true} className="flex-1">
								<a href="/help">{t("results.getHelp")}</a>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
