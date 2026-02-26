"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, RotateCcw, CheckCircle, Clock, Target, Code, TestTube } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ChallengeEditor } from "@/components/challenges/challenge-editor";
import { ChallengeInstructions } from "@/components/challenges/challenge-instructions";
import { ChallengeTests } from "@/components/challenges/challenge-tests";
import { ChallengeResults } from "@/components/challenges/challenge-results";
import { ChallengeHints } from "@/components/challenges/challenge-hints";

interface ChallengeData {
	id: string;
	title: string;
	description: string;
	difficulty: string;
	estimatedTime: string;
	xpReward: number;
	language: string;
	starterCode: string;
	instructions: Array<{ title: string; content: string }>;
	objectives: string[];
	tests: Array<{ id: string; description: string; type: "unit" | "integration" }>;
	hints: Array<{ content: string; cost: number }>;
}

interface TestResult {
	testId: string;
	passed: boolean;
	executionTime?: number;
	error?: string;
	output?: string;
}

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

interface RunResponse {
	testResults: TestResult[];
}

interface SubmitResponse {
	result: SubmissionResult;
}

export function ChallengeContent({
	courseId,
	challengeId,
	courseTitle,
	challenge,
}: {
	courseId: string;
	challengeId: string;
	courseTitle: string;
	challenge: ChallengeData;
}) {
	const t = useTranslations("challenges");
	const course = { id: courseId, title: courseTitle };

	const [code, setCode] = useState(challenge.starterCode);
	const [testResults, setTestResults] = useState<TestResult[]>([]);
	const [submissionResults, setSubmissionResults] = useState<SubmissionResult | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [completed, setCompleted] = useState(false);
	const [usedHints, setUsedHints] = useState<number[]>([]);

	const testsPassed = testResults.filter((r) => r.passed).length;

	const handleCodeChange = useCallback((newCode: string) => {
		setCode(newCode);
	}, []);

	const handleRunTests = useCallback(async () => {
		setIsRunning(true);
		try {
			const res = await fetch(
				`/api/challenges/${challengeId}/run?courseId=${encodeURIComponent(courseId)}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ code, language: challenge.language }),
				}
			);
			if (res.ok) {
				const data = (await res.json()) as RunResponse;
				setTestResults(data.testResults);
			}
		} finally {
			setIsRunning(false);
		}
	}, [code, challenge.language, challengeId, courseId]);

	const handleSubmit = useCallback(async () => {
		try {
			const res = await fetch(
				`/api/challenges/${challengeId}/run?courseId=${encodeURIComponent(courseId)}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ code, language: challenge.language, submit: true }),
				}
			);
			if (res.ok) {
				const data = (await res.json()) as SubmitResponse;
				setSubmissionResults(data.result);
				setTestResults(
					challenge.tests.map((test, i) => ({
						testId: test.id,
						passed: i < data.result.testsPassed,
						executionTime: Math.round(
							data.result.executionTime / challenge.tests.length
						),
					}))
				);
				if (data.result.passed) {
					setCompleted(true);
				}
			}
		} catch {
			// Network error — silent fail, UI already reverts
		}
	}, [code, challenge.language, challenge.tests, challengeId, courseId]);

	const handleRetry = useCallback(() => {
		setSubmissionResults(null);
		setTestResults([]);
	}, []);

	const handleUseHint = useCallback((hintIndex: number) => {
		setUsedHints((prev) => [...prev, hintIndex]);
	}, []);

	const handleReset = useCallback(() => {
		setCode(challenge.starterCode);
		setTestResults([]);
		setSubmissionResults(null);
	}, [challenge.starterCode]);

	return (
		<div className="flex flex-col lg:flex-row min-h-screen">
			<div className="flex-1 flex flex-col">
				<div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
					<div className="container mx-auto px-4 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<Button variant="ghost" asChild={true} className="gap-2">
									<a href={`/courses/${courseId}`}>
										<ArrowLeft className="h-4 w-4" />
										{t("editor.back")}
									</a>
								</Button>

								<Separator orientation="vertical" className="h-6" />

								<div>
									<h1 className="font-semibold text-lg">{course.title}</h1>
									<p className="text-sm text-muted-foreground">
										{challenge.title}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Badge variant="outline" className="gap-1">
									<Target className="h-3 w-3" />
									{challenge.difficulty}
								</Badge>
								<Badge variant="outline" className="gap-1">
									<Clock className="h-3 w-3" />
									{challenge.estimatedTime}
								</Badge>
								<Badge variant="outline" className="gap-1">
									<Code className="h-3 w-3" />
									{challenge.xpReward} XP
								</Badge>
							</div>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-hidden">
					<Tabs defaultValue="instructions" className="h-full flex flex-col">
						<div className="border-b px-4">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="instructions">
									{t("tabs.instructions")}
								</TabsTrigger>
								<TabsTrigger value="editor">{t("tabs.editor")}</TabsTrigger>
								<TabsTrigger value="tests">{t("tabs.tests")}</TabsTrigger>
								<TabsTrigger value="results">{t("tabs.results")}</TabsTrigger>
							</TabsList>
						</div>

						<div className="flex-1 overflow-hidden">
							<TabsContent value="instructions" className="h-full m-0">
								<ScrollArea className="h-full">
									<div className="p-6">
										<ChallengeInstructions challenge={challenge} />
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent value="editor" className="h-full m-0">
								<div className="h-full flex flex-col">
									<ChallengeEditor
										challenge={challenge}
										initialCode={code}
										onCodeChange={handleCodeChange}
										onRunTests={handleRunTests}
										onSubmit={handleSubmit}
									/>
								</div>
							</TabsContent>

							<TabsContent value="tests" className="h-full m-0">
								<ScrollArea className="h-full">
									<div className="p-6">
										<ChallengeTests
											tests={challenge.tests}
											results={testResults}
											onRunTests={handleRunTests}
											isRunning={isRunning}
										/>
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent value="results" className="h-full m-0">
								<ScrollArea className="h-full">
									<div className="p-6">
										<ChallengeResults
											results={submissionResults}
											onRetry={handleRetry}
										/>
									</div>
								</ScrollArea>
							</TabsContent>
						</div>
					</Tabs>
				</div>
			</div>

			<div className="w-full lg:w-80 border-l bg-muted/30">
				<div className="p-4 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<Target className="h-4 w-4" />
								{t("progress.title")}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<div className="flex justify-between text-sm mb-2">
									<span>{t("progress.testsPassed")}</span>
									<span>
										{testsPassed} / {challenge.tests.length}
									</span>
								</div>
								<Progress
									value={
										challenge.tests.length > 0
											? (testsPassed / challenge.tests.length) * 100
											: 0
									}
									className="h-2"
								/>
							</div>

							<div className="flex items-center gap-2">
								{completed ? (
									<CheckCircle className="h-5 w-5 text-green-500" />
								) : (
									<div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
								)}
								<span className="text-sm">
									{completed ? t("progress.completed") : t("progress.inProgress")}
								</span>
							</div>
						</CardContent>
					</Card>

					<ChallengeHints
						hints={challenge.hints}
						usedHints={usedHints}
						onUseHint={handleUseHint}
					/>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">{t("quickActions.title")}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Button
								className="w-full justify-start gap-2"
								onClick={handleRunTests}
								disabled={!code || isRunning}
							>
								<TestTube className="h-4 w-4" />
								{t("quickActions.runTests")}
							</Button>
							<Button
								className="w-full justify-start gap-2"
								onClick={handleSubmit}
								disabled={!code || completed}
							>
								<CheckCircle className="h-4 w-4" />
								{t("quickActions.submit")}
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-2"
								onClick={handleReset}
							>
								<RotateCcw className="h-4 w-4" />
								{t("quickActions.reset")}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
