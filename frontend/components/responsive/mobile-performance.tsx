import { useState, useEffect, useCallback, useRef } from "react";
import { Zap, Battery, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface PerformanceMetrics {
	fps: number;
	memoryUsage: number;
	networkLatency: number;
	batteryLevel: number;
	isLowPowerMode: boolean;
	connectionType: "slow" | "fast" | "unknown";
}

interface MobilePerformanceProps {
	className?: string;
	enableOptimizations?: boolean;
	onPerformanceChange?: (metrics: PerformanceMetrics) => void;
}

export function MobilePerformance({
	className,
	enableOptimizations = true,
	onPerformanceChange,
}: MobilePerformanceProps) {
	const t = useTranslations("performance");
	const { toast } = useToast();

	const [metrics, setMetrics] = useState<PerformanceMetrics>({
		fps: 60,
		memoryUsage: 0,
		networkLatency: 0,
		batteryLevel: 100,
		isLowPowerMode: false,
		connectionType: "unknown",
	});

	const [optimizations, setOptimizations] = useState({
		reduceMotion: false,
		lowQualityImages: false,
		disableAnimations: false,
		reduceBundleSize: false,
		enableCaching: true,
		lazyLoading: true,
		prefetching: false,
	});

	const fpsRef = useRef<number[]>([]);
	const lastFrameTime = useRef<number>(performance.now());
	const animationFrameRef = useRef<number | undefined>(undefined);

	const measureFPS = useCallback(() => {
		const now = performance.now();
		const delta = now - lastFrameTime.current;
		lastFrameTime.current = now;

		if (delta > 0) {
			const currentFPS = 1000 / delta;
			fpsRef.current.push(currentFPS);

			// Keep only last 60 measurements
			if (fpsRef.current.length > 60) {
				fpsRef.current.shift();
			}

			const averageFPS = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;
			setMetrics((prev) => ({ ...prev, fps: Math.round(averageFPS) }));
		}

		animationFrameRef.current = requestAnimationFrame(measureFPS);
	}, []);

	const measureMemory = useCallback(() => {
		if ("memory" in performance) {
			const perfWithMemory = performance as Performance & {
				memory: { usedJSHeapSize: number; totalJSHeapSize: number };
			};
			const memory = perfWithMemory.memory;
			const usedMemory = memory.usedJSHeapSize;
			const totalMemory = memory.totalJSHeapSize;
			const memoryUsage = (usedMemory / totalMemory) * 100;

			setMetrics((prev) => ({ ...prev, memoryUsage: Math.round(memoryUsage) }));
		}
	}, []);

	const measureNetwork = useCallback(async () => {
		try {
			const start = performance.now();
			await fetch("/api/health", { method: "HEAD" });
			const end = performance.now();
			const latency = end - start;

			setMetrics((prev) => ({ ...prev, networkLatency: Math.round(latency) }));

			// Determine connection type based on latency
			let connectionType: "slow" | "fast" | "unknown" = "unknown";
			if (latency < 100) connectionType = "fast";
			else if (latency < 500) connectionType = "slow";

			setMetrics((prev) => ({ ...prev, connectionType }));
		} catch (error) {
			console.warn("Network measurement failed:", error);
		}
	}, []);

	const checkBattery = useCallback(async () => {
		if ("getBattery" in navigator) {
			try {
				const battery = await (
					navigator as unknown as {
						getBattery: () => Promise<{ level: number; charging: boolean }>;
					}
				).getBattery();
				setMetrics((prev) => ({
					...prev,
					batteryLevel: Math.round(battery.level * 100),
					isLowPowerMode: battery.level < 0.2,
				}));
			} catch (_error) {
				console.warn("Battery API not supported");
			}
		}
	}, []);

	const applyOptimizations = useCallback(() => {
		if (!enableOptimizations) return;

		// Apply CSS optimizations
		const root = document.documentElement;

		if (optimizations.reduceMotion) {
			root.style.setProperty("--animation-duration", "0s");
		} else {
			root.style.removeProperty("--animation-duration");
		}

		if (optimizations.disableAnimations) {
			root.style.setProperty("--animation-play-state", "paused");
		} else {
			root.style.removeProperty("--animation-play-state");
		}

		// Apply image quality settings
		const images = document.querySelectorAll("img[data-optimize]");
		images.forEach((img) => {
			const imgElement = img as HTMLImageElement;
			if (optimizations.lowQualityImages) {
				imgElement.src = `${imgElement.src.replace(/\?.*$/, "")}?quality=low`;
			} else {
				imgElement.src = `${imgElement.src.replace(/\?.*$/, "")}?quality=high`;
			}
		});

		toast({
			title: t("optimizationsApplied"),
			description: t("optimizationsAppliedDescription"),
		});
	}, [optimizations, enableOptimizations, toast, t]);

	const toggleOptimization = useCallback((key: keyof typeof optimizations) => {
		setOptimizations((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	useEffect(() => {
		// Start performance monitoring
		measureFPS();
		measureMemory();
		measureNetwork();
		checkBattery();

		// Set up intervals
		const memoryInterval = setInterval(measureMemory, 5000);
		const networkInterval = setInterval(measureNetwork, 10_000);
		const batteryInterval = setInterval(checkBattery, 30_000);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			clearInterval(memoryInterval);
			clearInterval(networkInterval);
			clearInterval(batteryInterval);
		};
	}, [measureFPS, measureMemory, measureNetwork, checkBattery]);

	useEffect(() => {
		applyOptimizations();
		onPerformanceChange?.(metrics);
	}, [metrics, applyOptimizations, onPerformanceChange]);

	const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
		if (value >= thresholds.good) return "text-green-500";
		if (value >= thresholds.warning) return "text-yellow-500";
		return "text-red-500";
	};

	const getBatteryColor = (level: number) => {
		if (level > 50) return "text-green-500";
		if (level > 20) return "text-yellow-500";
		return "text-red-500";
	};

	return (
		<div className={cn("space-y-4", className)}>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="h-5 w-5" />
						{t("performanceMetrics")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">{t("fps")}</span>
								<span
									className={cn(
										"text-sm font-medium",
										getPerformanceColor(metrics.fps, { good: 50, warning: 30 })
									)}
								>
									{metrics.fps}
								</span>
							</div>
							<Progress
								value={Math.min((metrics.fps / 60) * 100, 100)}
								className="h-2"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">{t("memory")}</span>
								<span
									className={cn(
										"text-sm font-medium",
										getPerformanceColor(100 - metrics.memoryUsage, {
											good: 70,
											warning: 50,
										})
									)}
								>
									{metrics.memoryUsage}%
								</span>
							</div>
							<Progress value={metrics.memoryUsage} className="h-2" />
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">{t("network")}</span>
								<span
									className={cn(
										"text-sm font-medium",
										getPerformanceColor(500 - metrics.networkLatency, {
											good: 400,
											warning: 200,
										})
									)}
								>
									{metrics.networkLatency}ms
								</span>
							</div>
							<Progress
								value={Math.max(0, 100 - metrics.networkLatency / 5)}
								className="h-2"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">{t("battery")}</span>
								<span
									className={cn(
										"text-sm font-medium",
										getBatteryColor(metrics.batteryLevel)
									)}
								>
									{metrics.batteryLevel}%
								</span>
							</div>
							<Progress value={metrics.batteryLevel} className="h-2" />
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Badge
							variant={
								metrics.connectionType === "fast"
									? "default"
									: metrics.connectionType === "slow"
										? "secondary"
										: "outline"
							}
						>
							{t(metrics.connectionType)}
						</Badge>
						{metrics.isLowPowerMode && (
							<Badge variant="destructive">
								<Battery className="h-3 w-3 mr-1" />
								{t("lowPowerMode")}
							</Badge>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<HardDrive className="h-5 w-5" />
						{t("optimizations")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm">{t("reduceMotion")}</span>
							<Switch
								checked={optimizations.reduceMotion}
								onCheckedChange={() => toggleOptimization("reduceMotion")}
							/>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm">{t("lowQualityImages")}</span>
							<Switch
								checked={optimizations.lowQualityImages}
								onCheckedChange={() => toggleOptimization("lowQualityImages")}
							/>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm">{t("disableAnimations")}</span>
							<Switch
								checked={optimizations.disableAnimations}
								onCheckedChange={() => toggleOptimization("disableAnimations")}
							/>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm">{t("lazyLoading")}</span>
							<Switch
								checked={optimizations.lazyLoading}
								onCheckedChange={() => toggleOptimization("lazyLoading")}
							/>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm">{t("enableCaching")}</span>
							<Switch
								checked={optimizations.enableCaching}
								onCheckedChange={() => toggleOptimization("enableCaching")}
							/>
						</div>
					</div>

					<Button onClick={applyOptimizations} className="w-full" variant="outline">
						{t("applyOptimizations")}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
