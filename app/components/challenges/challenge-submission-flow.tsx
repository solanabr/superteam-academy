"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
	Code,
	Play,
	CheckCircle,
	XCircle,
	AlertCircle,
	Clock,
	Trophy,
	RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface Challenge {
	id: string;
	title: string;
	description: string;
	difficulty: "easy" | "medium" | "hard";
	timeLimit: number; // in minutes
	testCases: TestCase[];
	starterCode: string;
	language: string;
}

interface TestCase {
	id: string;
	input: string;
	expectedOutput: string;
	isHidden: boolean;
}

interface SubmissionResult {
	passed: boolean;
	testResults: TestResult[];
	executionTime: number;
	memoryUsage: number;
	feedback: string;
}

interface TestResult {
	testCaseId: string;
	passed: boolean;
	actualOutput: string;
	error?: string | undefined;
}

interface ChallengeSubmissionFlowProps {
	challenge: Challenge;
	onSuccess?: (challengeId: string, result: SubmissionResult) => void;
	onCancel?: () => void;
}

type SubmissionStep = "editor" | "testing" | "results" | "success";

export function ChallengeSubmissionFlow({
	challenge,
	onSuccess,
	onCancel,
}: ChallengeSubmissionFlowProps) {
	const t = useTranslations("challenges");
	const { toast } = useToast();
	const [currentStep, setCurrentStep] = useState<SubmissionStep>("editor");
	const [code, setCode] = useState(challenge.starterCode);
	const [isRunning, setIsRunning] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<SubmissionResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [timeRemaining, setTimeRemaining] = useState(challenge.timeLimit * 60); // in seconds
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// Timer effect
	const handleTimeUp = useCallback(() => {
		toast({
			title: t("timeUp"),
			description: t("timeUpDesc"),
			variant: "destructive",
		});
		onCancel?.();
	}, [toast, t, onCancel]);

	useEffect(() => {
		timerRef.current = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev <= 1 && timerRef.current) {
					clearInterval(timerRef.current);
					handleTimeUp();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [handleTimeUp]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "easy":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
			case "hard":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		}
	};

	const runTests = async () => {
		try {
			setIsRunning(true);
			setError(null);

			// Simulate test execution
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Mock test results
			const mockResult: SubmissionResult = {
				passed: Math.random() > 0.3, // 70% pass rate for demo
				testResults: challenge.testCases.map((tc) => ({
					testCaseId: tc.id,
					passed: Math.random() > 0.4,
					actualOutput: tc.expectedOutput + (Math.random() > 0.6 ? " (modified)" : ""),
					error: Math.random() > 0.8 ? "Runtime error: division by zero" : undefined,
				})),
				executionTime: Math.random() * 1000 + 100,
				memoryUsage: Math.random() * 50 + 10,
				feedback:
					"Good attempt! Consider optimizing your algorithm for better performance.",
			};

			setResult(mockResult);
			setCurrentStep("results");

			if (mockResult.passed) {
				toast({
					title: t("testsPassed"),
					description: t("testsPassedDesc"),
				});
			} else {
				toast({
					title: t("testsFailed"),
					description: t("testsFailedDesc"),
					variant: "destructive",
				});
			}
		} catch (_err) {
			setError(t("testExecutionFailed"));
			toast({
				title: t("testExecutionFailed"),
				description: t("testExecutionFailedDesc"),
				variant: "destructive",
			});
		} finally {
			setIsRunning(false);
		}
	};

	const submitSolution = async () => {
		if (!result?.passed) return;

		try {
			setIsSubmitting(true);
			setError(null);

			// Simulate submission
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setCurrentStep("success");
			toast({
				title: t("challengeCompleted"),
				description: t("challengeCompletedDesc", { challenge: challenge.title }),
			});

			onSuccess?.(challenge.id, result);
		} catch (_err) {
			setError(t("submissionFailed"));
			toast({
				title: t("submissionFailed"),
				description: t("submissionFailedDesc"),
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetCode = () => {
		setCode(challenge.starterCode);
		setResult(null);
		setCurrentStep("editor");
	};

	const renderStep = () => {
		switch (currentStep) {
			case "editor":
				return (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<h2 className="text-xl font-semibold">{challenge.title}</h2>
								<p className="text-muted-foreground">{challenge.description}</p>
							</div>
							<div className="text-right space-y-1">
								<Badge className={getDifficultyColor(challenge.difficulty)}>
									{t(challenge.difficulty)}
								</Badge>
								<div className="text-sm text-muted-foreground flex items-center gap-1">
									<Clock className="h-3 w-3" />
									{formatTime(timeRemaining)}
								</div>
							</div>
						</div>

						<Tabs defaultValue="code" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="code">{t("code")}</TabsTrigger>
								<TabsTrigger value="tests">{t("testCases")}</TabsTrigger>
							</TabsList>
							<TabsContent value="code" className="space-y-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">
										{t("yourSolution")} ({challenge.language})
									</label>
									<Textarea
										value={code}
										onChange={(e) => setCode(e.target.value)}
										placeholder={t("writeYourCode")}
										className="min-h-75 font-mono text-sm"
									/>
								</div>
							</TabsContent>
							<TabsContent value="tests" className="space-y-4">
								<div className="space-y-3">
									{challenge.testCases
										.filter((tc) => !tc.isHidden)
										.map((tc) => (
											<Card key={tc.id}>
												<CardContent className="pt-4">
													<div className="space-y-2">
														<div className="text-sm font-medium">
															{t("input")}:
														</div>
														<div className="p-2 bg-muted rounded font-mono text-sm">
															{tc.input}
														</div>
														<div className="text-sm font-medium">
															{t("expectedOutput")}:
														</div>
														<div className="p-2 bg-muted rounded font-mono text-sm">
															{tc.expectedOutput}
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									{challenge.testCases.some((tc) => tc.isHidden) && (
										<Alert>
											<AlertCircle className="h-4 w-4" />
											<AlertDescription>
												{t("hiddenTestCases", {
													count: challenge.testCases.filter(
														(tc) => tc.isHidden
													).length,
												})}
											</AlertDescription>
										</Alert>
									)}
								</div>
							</TabsContent>
						</Tabs>

						<div className="flex gap-3">
							<Button variant="outline" onClick={resetCode} disabled={isRunning}>
								<RotateCcw className="h-4 w-4 mr-2" />
								{t("reset")}
							</Button>
							<Button variant="outline" onClick={onCancel} disabled={isRunning}>
								{t("cancel")}
							</Button>
							<Button onClick={runTests} disabled={isRunning || !code.trim()}>
								<Play className="h-4 w-4 mr-2" />
								{isRunning ? t("running") : t("runTests")}
							</Button>
						</div>
					</div>
				);

			case "testing":
				return (
					<div className="text-center space-y-6">
						<div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
							<Play className="h-8 w-8 text-blue-600 animate-pulse" />
						</div>
						<div className="space-y-2">
							<h2 className="text-xl font-semibold">{t("runningTests")}</h2>
							<p className="text-muted-foreground">{t("runningTestsDesc")}</p>
						</div>
						<Progress value={66} className="w-full" />
					</div>
				);

			case "results":
				if (!result) return null;

				return (
					<div className="space-y-6">
						<div className="text-center space-y-4">
							<div
								className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
									result.passed
										? "bg-green-100 dark:bg-green-900"
										: "bg-red-100 dark:bg-red-900"
								}`}
							>
								{result.passed ? (
									<CheckCircle className="h-8 w-8 text-green-600" />
								) : (
									<XCircle className="h-8 w-8 text-red-600" />
								)}
							</div>
							<div className="space-y-2">
								<h2 className="text-xl font-semibold">
									{result.passed ? t("testsPassed") : t("testsFailed")}
								</h2>
								<p className="text-muted-foreground">
									{result.passed ? t("testsPassedDesc") : t("testsFailedDesc")}
								</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="text-center p-3 bg-muted rounded-lg">
								<div className="text-2xl font-bold">
									{result.executionTime.toFixed(1)}ms
								</div>
								<div className="text-sm text-muted-foreground">
									{t("executionTime")}
								</div>
							</div>
							<div className="text-center p-3 bg-muted rounded-lg">
								<div className="text-2xl font-bold">
									{result.memoryUsage.toFixed(1)}MB
								</div>
								<div className="text-sm text-muted-foreground">
									{t("memoryUsage")}
								</div>
							</div>
						</div>

						<div className="space-y-3">
							<h3 className="font-medium">{t("testResults")}</h3>
							{result.testResults.map((testResult) => (
								<Card key={testResult.testCaseId}>
									<CardContent className="pt-4">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">
												{t("testCase")} {testResult.testCaseId}
											</span>
											{testResult.passed ? (
												<CheckCircle className="h-4 w-4 text-green-600" />
											) : (
												<XCircle className="h-4 w-4 text-red-600" />
											)}
										</div>
										{testResult.error && (
											<Alert variant="destructive" className="mt-2">
												<AlertCircle className="h-4 w-4" />
												<AlertDescription className="text-sm">
													{testResult.error}
												</AlertDescription>
											</Alert>
										)}
									</CardContent>
								</Card>
							))}
						</div>

						{result.feedback && (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{result.feedback}</AlertDescription>
							</Alert>
						)}

						<div className="flex gap-3">
							<Button variant="outline" onClick={() => setCurrentStep("editor")}>
								{t("editCode")}
							</Button>
							{result.passed && (
								<Button onClick={submitSolution} disabled={isSubmitting}>
									<Trophy className="h-4 w-4 mr-2" />
									{isSubmitting ? t("submitting") : t("submitSolution")}
								</Button>
							)}
						</div>
					</div>
				);

			case "success":
				return (
					<div className="text-center space-y-6">
						<div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
							<Trophy className="h-8 w-8 text-green-600" />
						</div>
						<div className="space-y-2">
							<h2 className="text-xl font-semibold">{t("challengeCompleted")}</h2>
							<p className="text-muted-foreground">
								{t("challengeCompletedDesc", { challenge: challenge.title })}
							</p>
						</div>

						<div className="space-y-4">
							<div className="p-4 bg-muted rounded-lg">
								<h3 className="font-medium mb-2">{t("yourResults")}</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground">
											{t("executionTime")}:
										</span>
										<div className="font-medium">
											{result?.executionTime.toFixed(1)}ms
										</div>
									</div>
									<div>
										<span className="text-muted-foreground">
											{t("memoryUsage")}:
										</span>
										<div className="font-medium">
											{result?.memoryUsage.toFixed(1)}MB
										</div>
									</div>
								</div>
							</div>

							<Button
								onClick={() => result && onSuccess?.(challenge.id, result)}
								className="w-full"
							>
								<Trophy className="h-4 w-4 mr-2" />
								{t("continue")}
							</Button>
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<Card className="w-full max-w-4xl">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Code className="h-5 w-5" />
					{t("challengeSubmission")}
				</CardTitle>
				{currentStep !== "success" && (
					<Progress value={getStepProgress()} className="mt-2" />
				)}
			</CardHeader>
			<CardContent>
				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{renderStep()}
			</CardContent>
		</Card>
	);

	function getStepProgress(): number {
		const steps = ["editor", "testing", "results", "success"];
		const currentIndex = steps.indexOf(currentStep);
		return ((currentIndex + 1) / steps.length) * 100;
	}
}
