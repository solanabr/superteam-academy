"use client";

import { CheckCircle, XCircle, Clock, Play, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";

interface Test {
	id: string;
	description: string;
	type: "unit" | "integration";
}

interface TestResult {
	testId: string;
	passed: boolean;
	executionTime?: number;
	error?: string;
	output?: string;
}

interface ChallengeTestsProps {
	tests: Test[];
	results?: TestResult[];
	onRunTests?: () => void;
	isRunning?: boolean;
}

export function ChallengeTests({
	tests,
	results = [],
	onRunTests,
	isRunning = false,
}: ChallengeTestsProps) {
	const t = useTranslations("challenges");

	const passedTests = results.filter((result) => result.passed).length;
	const totalTests = tests.length;
	const progressPercentage = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

	const getTestResult = (testId: string): TestResult | undefined => {
		return results.find((result) => result.testId === testId);
	};

	const getTestStatusIcon = (testId: string) => {
		const result = getTestResult(testId);
		if (!result) return <Clock className="h-4 w-4 text-muted-foreground" />;
		if (result.passed) return <CheckCircle className="h-4 w-4 text-green-500" />;
		return <XCircle className="h-4 w-4 text-red-500" />;
	};

	const getTestStatusBadge = (testId: string) => {
		const result = getTestResult(testId);
		if (!result) return <Badge variant="outline">{t("tests.pending")}</Badge>;
		if (result.passed)
			return (
				<Badge variant="default" className="bg-green-500">
					{t("tests.passed")}
				</Badge>
			);
		return <Badge variant="destructive">{t("tests.failed")}</Badge>;
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>{t("tests.testResults")}</span>
						<Button onClick={onRunTests} disabled={isRunning} className="gap-2">
							{isRunning ? (
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							) : (
								<Play className="h-4 w-4" />
							)}
							{isRunning ? t("tests.running") : t("tests.runAll")}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">
								{passedTests} / {totalTests} {t("tests.testsPassed")}
							</span>
							<span className="text-sm text-muted-foreground">
								{Math.round(progressPercentage)}%
							</span>
						</div>
						<Progress value={progressPercentage} className="h-2" />
					</div>
				</CardContent>
			</Card>

			<div className="space-y-4">
				{tests.map((test, index) => {
					const result = getTestResult(test.id);

					return (
						<Card
							key={test.id}
							className={
								result?.passed
									? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
									: ""
							}
						>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										{getTestStatusIcon(test.id)}
										<div>
											<CardTitle className="text-base">
												Test {index + 1}: {test.description}
											</CardTitle>
											<div className="flex items-center gap-2 mt-1">
												{getTestStatusBadge(test.id)}
												<Badge variant="outline" className="text-xs">
													{test.type}
												</Badge>
												{result?.executionTime && (
													<Badge variant="outline" className="text-xs">
														{result.executionTime}ms
													</Badge>
												)}
											</div>
										</div>
									</div>
								</div>
							</CardHeader>

							{result && (
								<CardContent className="pt-0">
									{!result.passed && result.error && (
										<div className="space-y-2">
											<div className="flex items-center gap-2 text-red-600 dark:text-red-400">
												<AlertCircle className="h-4 w-4" />
												<span className="text-sm font-medium">
													{t("tests.error")}
												</span>
											</div>
											<pre className="text-xs bg-red-50 dark:bg-red-950/20 p-3 rounded border text-red-800 dark:text-red-200 overflow-x-auto">
												{result.error}
											</pre>
										</div>
									)}

									{result.output && (
										<div className="space-y-2 mt-4">
											<span className="text-sm font-medium">
												{t("tests.output")}
											</span>
											<pre className="text-xs bg-muted p-3 rounded border overflow-x-auto">
												{result.output}
											</pre>
										</div>
									)}
								</CardContent>
							)}
						</Card>
					);
				})}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("tests.testTypes")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<h4 className="font-medium text-sm">{t("tests.unitTests")}</h4>
							<p className="text-xs text-muted-foreground">
								{t("tests.unitDescription")}
							</p>
							<Badge variant="outline" className="text-xs">
								{tests.filter((t) => t.type === "unit").length} {t("tests.tests")}
							</Badge>
						</div>

						<div className="space-y-2">
							<h4 className="font-medium text-sm">{t("tests.integrationTests")}</h4>
							<p className="text-xs text-muted-foreground">
								{t("tests.integrationDescription")}
							</p>
							<Badge variant="outline" className="text-xs">
								{tests.filter((t) => t.type === "integration").length}{" "}
								{t("tests.tests")}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
