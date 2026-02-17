import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Smartphone,
    TestTube,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Play,
    Square,
    RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface TestResult {
	id: string;
	name: string;
	status: "pending" | "running" | "passed" | "failed" | "skipped";
	duration?: number;
	error?: string;
	device?: string;
	browser?: string;
}

interface MobileTestingProps {
	className?: string;
	autoRun?: boolean;
	onTestComplete?: (results: TestResult[]) => void;
}

export function MobileTesting({ className, autoRun = false, onTestComplete }: MobileTestingProps) {
	const t = useTranslations("testing");
	const { toast } = useToast();

	const [isRunning, setIsRunning] = useState(false);
	const [progress, setProgress] = useState(0);
	const [results, setResults] = useState<TestResult[]>([]);
	const [selectedDevices, setSelectedDevices] = useState<string[]>(["mobile"]);

	const testSuites = useMemo(
		() => [
			{
				id: "responsive",
				name: t("responsiveDesign"),
				tests: [
					{ id: "viewport", name: t("viewportScaling") },
					{ id: "touch-targets", name: t("touchTargets") },
					{ id: "orientation", name: t("orientationChange") },
					{ id: "font-scaling", name: t("fontScaling") },
				],
			},
			{
				id: "performance",
				name: t("performance"),
				tests: [
					{ id: "load-time", name: t("loadTime") },
					{ id: "memory-usage", name: t("memoryUsage") },
					{ id: "battery-impact", name: t("batteryImpact") },
					{ id: "network-efficiency", name: t("networkEfficiency") },
				],
			},
			{
				id: "gestures",
				name: t("gestures"),
				tests: [
					{ id: "touch-events", name: t("touchEvents") },
					{ id: "swipe-gestures", name: t("swipeGestures") },
					{ id: "pinch-zoom", name: t("pinchZoom") },
					{ id: "long-press", name: t("longPress") },
				],
			},
			{
				id: "accessibility",
				name: t("accessibility"),
				tests: [
					{ id: "screen-reader", name: t("screenReader") },
					{ id: "keyboard-nav", name: t("keyboardNavigation") },
					{ id: "color-contrast", name: t("colorContrast") },
					{ id: "focus-management", name: t("focusManagement") },
				],
			},
		],
		[t]
	);

	const devices = [
		{ id: "mobile", name: "Mobile (375px)", width: 375, height: 667 },
		{ id: "tablet", name: "Tablet (768px)", width: 768, height: 1024 },
		{ id: "desktop", name: "Desktop (1920px)", width: 1920, height: 1080 },
	];

	const runTest = useCallback(
		async (testId: string, testName: string): Promise<TestResult> => {
			const startTime = Date.now();

			try {
				// Simulate test execution
				await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 500));

				// Mock test logic
				const shouldFail = Math.random() < 0.1; // 10% failure rate
				const duration = Date.now() - startTime;

				if (shouldFail) {
					throw new Error(`Test ${testName} failed randomly`);
				}

				return {
					id: testId,
					name: testName,
					status: "passed",
					duration,
					device: selectedDevices.join(", "),
					browser: navigator.userAgent,
				};
			} catch (error) {
				return {
					id: testId,
					name: testName,
					status: "failed",
					duration: Date.now() - startTime,
					error: error instanceof Error ? error.message : "Unknown error",
					device: selectedDevices.join(", "),
					browser: navigator.userAgent,
				};
			}
		},
		[selectedDevices]
	);

	const runAllTests = useCallback(async () => {
		setIsRunning(true);
		setProgress(0);
		setResults([]);

		const allTests: TestResult[] = [];
		let completedTests = 0;

		for (const suite of testSuites) {
			for (const test of suite.tests) {
				const result = await runTest(test.id, test.name);
				allTests.push(result);
				setResults((prev) => [...prev, result]);

				completedTests++;
				setProgress((completedTests / (testSuites.length * 4)) * 100);
			}
		}

		setIsRunning(false);
		setProgress(100);

		const passedTests = allTests.filter((r) => r.status === "passed").length;
		const failedTests = allTests.filter((r) => r.status === "failed").length;

		toast({
			title: t("testsCompleted"),
			description: t("testResults", {
				passed: passedTests,
				failed: failedTests,
				total: allTests.length,
			}),
			variant: failedTests > 0 ? "destructive" : "default",
		});

		onTestComplete?.(allTests);
	}, [runTest, testSuites, toast, t, onTestComplete]);

	const toggleDevice = useCallback((deviceId: string) => {
		setSelectedDevices((prev) =>
			prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
		);
	}, []);

	const resetTests = useCallback(() => {
		setResults([]);
		setProgress(0);
		setIsRunning(false);
	}, []);

	useEffect(() => {
		if (autoRun) {
			runAllTests();
		}
	}, [autoRun, runAllTests]);

	const getStatusIcon = (status: TestResult["status"]) => {
		switch (status) {
			case "passed":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "failed":
				return <XCircle className="h-4 w-4 text-red-500" />;
			case "running":
				return (
					<div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
				);
			case "pending":
				return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
			default:
				return null;
		}
	};

	const getStatusBadge = (status: TestResult["status"]) => {
		const variants = {
			passed: "default" as const,
			failed: "destructive" as const,
			running: "secondary" as const,
			pending: "outline" as const,
			skipped: "outline" as const,
		};

		return <Badge variant={variants[status]}>{t(status)}</Badge>;
	};

	const passedTests = results.filter((r) => r.status === "passed").length;
	const failedTests = results.filter((r) => r.status === "failed").length;
	const totalTests = results.length;

	return (
		<div className={cn("space-y-4", className)}>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TestTube className="h-5 w-5" />
						{t("mobileTesting")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h4 className="text-sm font-medium mb-2">{t("selectDevices")}</h4>
						<div className="flex flex-wrap gap-2">
							{devices.map((device) => (
								<Button
									key={device.id}
									variant={
										selectedDevices.includes(device.id) ? "default" : "outline"
									}
									size="sm"
									onClick={() => toggleDevice(device.id)}
									disabled={isRunning}
								>
									<Smartphone className="h-3 w-3 mr-1" />
									{device.name}
								</Button>
							))}
						</div>
					</div>

					{isRunning && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">{t("runningTests")}</span>
								<span className="text-sm text-muted-foreground">
									{Math.round(progress)}%
								</span>
							</div>
							<Progress value={progress} className="h-2" />
						</div>
					)}

					<div className="flex gap-2">
						<Button
							onClick={runAllTests}
							disabled={isRunning || selectedDevices.length === 0}
							className="flex-1"
						>
							{isRunning ? (
								<>
									<Square className="h-4 w-4 mr-2" />
									{t("stopTests")}
								</>
							) : (
								<>
									<Play className="h-4 w-4 mr-2" />
									{t("runTests")}
								</>
							)}
						</Button>
						<Button variant="outline" onClick={resetTests} disabled={isRunning}>
							<RotateCcw className="h-4 w-4" />
						</Button>
					</div>
				</CardContent>
			</Card>

			{results.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>{t("testResults")}</span>
							<div className="flex gap-2">
								<Badge variant="default">
									{passedTests} {t("passed")}
								</Badge>
								{failedTests > 0 && (
									<Badge variant="destructive">
										{failedTests} {t("failed")}
									</Badge>
								)}
								<Badge variant="outline">
									{totalTests} {t("total")}
								</Badge>
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{results.map((result) => (
								<div
									key={result.id}
									className="flex items-center justify-between p-3 rounded-lg border"
								>
									<div className="flex items-center gap-3">
										{getStatusIcon(result.status)}
										<div>
											<p className="text-sm font-medium">{result.name}</p>
											{result.duration && (
												<p className="text-xs text-muted-foreground">
													{result.duration}ms
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										{getStatusBadge(result.status)}
										{result.error && (
											<div
												className="text-xs text-red-500 max-w-32 truncate"
												title={result.error}
											>
												{result.error}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>{t("testSuites")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{testSuites.map((suite) => (
							<div key={suite.id} className="space-y-2">
								<h4 className="text-sm font-medium">{suite.name}</h4>
								<div className="grid grid-cols-2 gap-2">
									{suite.tests.map((test) => {
										const result = results.find((r) => r.id === test.id);
										return (
											<div
												key={test.id}
												className="flex items-center gap-2 p-2 rounded border text-sm"
											>
												{result ? (
													getStatusIcon(result.status)
												) : (
													<AlertTriangle className="h-3 w-3 text-gray-400" />
												)}
												<span className="truncate">{test.name}</span>
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
