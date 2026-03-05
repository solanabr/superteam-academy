"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, CheckCircle, Clock, Target, Code, TestTube } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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

interface ValidationResponse {
	validation: {
		valid: boolean;
		error?: string;
	};
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
	const [, setCompleted] = useState(false);
	const [usedHints, setUsedHints] = useState<number[]>([]);
	const [liveValidation, setLiveValidation] = useState<{
		status: "idle" | "checking" | "valid" | "invalid";
		message: string;
	}>({ status: "idle", message: "" });

	const testsPassed = testResults.filter((r) => r.passed).length;

	const handleCodeChange = useCallback((newCode: string) => {
		setCode(newCode);
	}, []);

	useEffect(() => {
		if (!code.trim()) {
			setLiveValidation({ status: "idle", message: "" });
			return;
		}

		const timeoutId = window.setTimeout(async () => {
			setLiveValidation({ status: "checking", message: "Checking code..." });
			try {
				const res = await fetch(
					`/api/challenges/${challengeId}/run?courseId=${encodeURIComponent(courseId)}`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							code,
							language: challenge.language,
							validateOnly: true,
						}),
					}
				);

				if (!res.ok) {
					setLiveValidation({
						status: "invalid",
						message: "Unable to validate code right now",
					});
					return;
				}

				const data = (await res.json()) as ValidationResponse;
				if (data.validation.valid) {
					setLiveValidation({ status: "valid", message: "Syntax checks passed" });
					return;
				}

				setLiveValidation({
					status: "invalid",
					message: data.validation.error ?? "Validation failed",
				});
			} catch {
				setLiveValidation({
					status: "invalid",
					message: "Unable to validate code right now",
				});
			}
		}, 450);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [challenge.language, challengeId, code, courseId]);

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
			/* noop */
		}
	}, [code, challenge.language, challenge.tests, challengeId, courseId]);

	const handleRetry = useCallback(() => {
		setSubmissionResults(null);
		setTestResults([]);
	}, []);

	const handleUseHint = useCallback((hintIndex: number) => {
		setUsedHints((prev) => [...prev, hintIndex]);
	}, []);

	const [activeTab, setActiveTab] = useState("tests");

	return (
		<div className="flex flex-col h-screen">
			{/* Header bar */}
			<div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40 shrink-0">
				<div className="px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button variant="ghost" size="sm" asChild={true} className="gap-2">
								<a href={`/courses/${courseId}/lessons/${challengeId}`}>
									<ArrowLeft className="h-4 w-4" />
									{t("editor.back")}
								</a>
							</Button>

							<Separator orientation="vertical" className="h-5" />

							<div>
								<h1 className="font-semibold text-sm">{course.title}</h1>
								<p className="text-xs text-muted-foreground">{challenge.title}</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Badge variant="outline" className="gap-1 text-xs">
								<Target className="h-3 w-3" />
								{challenge.difficulty}
							</Badge>
							<Badge variant="outline" className="gap-1 text-xs">
								<Clock className="h-3 w-3" />
								{challenge.estimatedTime}
							</Badge>
							<Badge variant="outline" className="gap-1 text-xs">
								<Code className="h-3 w-3" />
								{challenge.xpReward} XP
							</Badge>
						</div>
					</div>
				</div>
			</div>
			<ResizablePanelGroup
				orientation="horizontal"
				className="flex-1 min-h-0 overflow-hidden"
			>
				<ResizablePanel defaultSize={50} minSize={25} maxSize={65}>
					<ScrollArea className="h-full">
						<div className="p-5">
							<ChallengeInstructions challenge={challenge} />
						</div>
					</ScrollArea>
				</ResizablePanel>

				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={30} maxSize={60}>
					<div className="h-full">
						<div className="h-full">
							<div className="h-full overflow-auto">
								<ChallengeEditor
									challenge={challenge}
									initialCode={code}
									liveValidation={liveValidation}
									onCodeChange={handleCodeChange}
									onRunTests={handleRunTests}
									onSubmit={handleSubmit}
								/>
							</div>
							<div className="h-full overflow-hidden flex flex-col">
								<Tabs
									value={activeTab}
									onValueChange={setActiveTab}
									className="flex-1 flex flex-col min-h-0"
								>
									<div className="border-b shrink-0">
										<TabsList className="w-full justify-start rounded-none bg-transparent h-9 px-2">
											<TabsTrigger
												value="tests"
												className="gap-1.5 text-xs data-[state=active]:bg-muted rounded-sm px-3 py-1.5"
											>
												<TestTube className="h-3.5 w-3.5" />
												{t("tabs.tests")}
												{testResults.length > 0 && (
													<Badge
														variant={
															testsPassed === challenge.tests.length
																? "default"
																: "secondary"
														}
														className="text-[10px] px-1 py-0 h-4 ml-1"
													>
														{testsPassed}/{challenge.tests.length}
													</Badge>
												)}
											</TabsTrigger>
											<TabsTrigger
												value="results"
												className="gap-1.5 text-xs data-[state=active]:bg-muted rounded-sm px-3 py-1.5"
											>
												<CheckCircle className="h-3.5 w-3.5" />
												{t("tabs.results")}
												{submissionResults && (
													<Badge
														variant={
															submissionResults.passed
																? "default"
																: "destructive"
														}
														className="text-[10px] px-1 py-0 h-4 ml-1"
													>
														{submissionResults.score}/
														{submissionResults.maxScore}
													</Badge>
												)}
											</TabsTrigger>
											{challenge.hints.length > 0 && (
												<TabsTrigger
													value="hints"
													className="gap-1.5 text-xs data-[state=active]:bg-muted rounded-sm px-3 py-1.5"
												>
													<Target className="h-3.5 w-3.5" />
													{t("hints.title")}
													<Badge
														variant="outline"
														className="text-[10px] px-1 py-0 h-4 ml-1"
													>
														{usedHints.length}/{challenge.hints.length}
													</Badge>
												</TabsTrigger>
											)}
										</TabsList>
									</div>

									<TabsContent
										value="tests"
										className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden"
									>
										<ScrollArea className="h-full">
											<div className="p-4">
												<ChallengeTests
													tests={challenge.tests}
													results={testResults}
													onRunTests={handleRunTests}
													isRunning={isRunning}
												/>
												{challenge.tests.length > 0 && (
													<div className="mt-4">
														<div className="flex justify-between text-xs text-muted-foreground mb-1.5">
															<span>{t("progress.testsPassed")}</span>
															<span>
																{testsPassed} /{" "}
																{challenge.tests.length}
															</span>
														</div>
														<Progress
															value={
																(testsPassed /
																	challenge.tests.length) *
																100
															}
															className="h-1.5"
														/>
													</div>
												)}
											</div>
										</ScrollArea>
									</TabsContent>

									<TabsContent
										value="results"
										className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden"
									>
										<ScrollArea className="h-full">
											<div className="p-4">
												<ChallengeResults
													results={submissionResults}
													onRetry={handleRetry}
												/>
											</div>
										</ScrollArea>
									</TabsContent>

									{challenge.hints.length > 0 && (
										<TabsContent
											value="hints"
											className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden"
										>
											<ScrollArea className="h-full">
												<div className="p-4">
													<ChallengeHints
														hints={challenge.hints}
														usedHints={usedHints}
														onUseHint={handleUseHint}
													/>
												</div>
											</ScrollArea>
										</TabsContent>
									)}
								</Tabs>
							</div>
						</div>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
