"use client";

import { CheckCircle, XCircle, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";

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
		if (!result)
			return <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />;
		if (result.passed) return <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />;
		return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">
						{passedTests}/{totalTests} {t("tests.testsPassed")}
					</span>
					<Progress value={progressPercentage} className="h-1.5 w-20" />
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={onRunTests}
					disabled={isRunning}
					className="gap-1.5 h-7 text-xs"
				>
					{isRunning ? (
						<div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : (
						<Play className="h-3 w-3" />
					)}
					{isRunning ? t("tests.running") : t("tests.runAll")}
				</Button>
			</div>

			<div className="space-y-1.5">
				{tests.map((test, index) => {
					const result = getTestResult(test.id);

					return (
						<div
							key={test.id}
							className={`border rounded-md px-3 py-2 ${
								result?.passed
									? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
									: ""
							}`}
						>
							<div className="flex items-center gap-2">
								{getTestStatusIcon(test.id)}
								<span className="text-xs font-medium flex-1">
									{index + 1}. {test.description}
								</span>
								<span className="text-[10px] text-muted-foreground">
									{test.type}
								</span>
								{result?.executionTime && (
									<span className="text-[10px] text-muted-foreground">
										{result.executionTime}ms
									</span>
								)}
							</div>

							{result && !result.passed && result.error && (
								<pre className="text-[11px] bg-red-50 dark:bg-red-950/20 p-2 rounded mt-2 text-red-800 dark:text-red-200 overflow-x-auto">
									{result.error}
								</pre>
							)}

							{result?.output && (
								<pre className="text-[11px] bg-muted p-2 rounded mt-2 overflow-x-auto">
									{result.output}
								</pre>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
