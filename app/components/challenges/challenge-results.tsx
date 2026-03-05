"use client";

import { CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";
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
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<p className="text-sm font-medium mb-1">{t("results.noResults")}</p>
				<p className="text-xs text-muted-foreground">{t("results.submitToSee")}</p>
			</div>
		);
	}

	const scorePercentage = (results.score / results.maxScore) * 100;
	// const testsPercentage = (results.testsPassed / results.totalTests) * 100;

	return (
		<div className="space-y-4">
			<div
				className={`border rounded-md p-3 ${
					results.passed
						? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
						: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
				}`}
			>
				<div className="flex items-center gap-2 mb-3">
					{results.passed ? (
						<CheckCircle className="h-4 w-4 text-green-500" />
					) : (
						<XCircle className="h-4 w-4 text-red-500" />
					)}
					<span className="text-sm font-medium">
						{results.passed ? t("results.passed") : t("results.failed")}
					</span>
				</div>

				<div className="grid grid-cols-4 gap-3 text-center mb-3">
					<div>
						<div className="text-base font-bold">{results.score}</div>
						<div className="text-[10px] text-muted-foreground">
							{t("results.score")}
						</div>
					</div>
					<div>
						<div className="text-base font-bold">{results.testsPassed}</div>
						<div className="text-[10px] text-muted-foreground">
							{t("results.testsPassed")}
						</div>
					</div>
					<div>
						<div className="text-base font-bold">{results.executionTime}ms</div>
						<div className="text-[10px] text-muted-foreground">
							{t("results.executionTime")}
						</div>
					</div>
					<div>
						<div className="text-base font-bold text-green-600">
							+{results.xpEarned}
						</div>
						<div className="text-[10px] text-muted-foreground">
							{t("results.xpEarned")}
						</div>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex justify-between text-xs">
						<span>{t("results.overallScore")}</span>
						<span>{Math.round(scorePercentage)}%</span>
					</div>
					<Progress value={scorePercentage} className="h-1.5" />
				</div>
			</div>

			{results.feedback.length > 0 && (
				<div className="space-y-1.5">
					<h4 className="text-xs font-medium">{t("results.feedback")}</h4>
					{results.feedback.map((item, index) => (
						<div key={index} className="flex items-start gap-2">
							<div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
							<p className="text-xs text-muted-foreground">{item}</p>
						</div>
					))}
				</div>
			)}

			{results.achievements && results.achievements.length > 0 && (
				<div className="space-y-1.5">
					<h4 className="text-xs font-medium">{t("results.achievements")}</h4>
					{results.achievements.map((achievement, index) => (
						<div key={index} className="flex items-center gap-2">
							<Trophy className="h-3 w-3 text-yellow-500" />
							<span className="text-xs">{achievement}</span>
						</div>
					))}
				</div>
			)}

			<div className="space-y-3">
				{results.nextChallenge ? (
					<div className="flex items-center justify-between p-2 border rounded-md">
						<div>
							<h4 className="text-xs font-medium">{results.nextChallenge.title}</h4>
							<p className="text-[10px] text-muted-foreground">
								{t("results.nextChallenge")}
							</p>
						</div>
						<Button size="sm" variant="outline" className="h-7 text-xs" asChild={true}>
							<a href={`/courses/challenge/${results.nextChallenge.id}`}>
								{t("results.continue")}
							</a>
						</Button>
					</div>
				) : (
					<p className="text-xs text-muted-foreground text-center py-2">
						{t("results.completedAll")}
					</p>
				)}

				{!results.passed && (
					<div className="flex gap-2">
						<Button size="sm" onClick={onRetry} className="flex-1 gap-1.5 h-7 text-xs">
							<RotateCcw className="h-3 w-3" />
							{t("results.tryAgain")}
						</Button>
						<Button
							size="sm"
							variant="outline"
							asChild={true}
							className="flex-1 h-7 text-xs"
						>
							<a href="/help">{t("results.getHelp")}</a>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
