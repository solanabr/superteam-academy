import { useState, useEffect, useCallback } from "react";
import { Zap, Shield, Settings, Download, Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface MobileOptimizationProps {
	className?: string;
	onOptimizationChange?: (settings: MobileOptimizationSettings) => void;
}

interface MobileOptimizationSettings {
	imageQuality: "low" | "medium" | "high" | "auto";
	preloadStrategy: "none" | "viewport" | "aggressive";
	cacheStrategy: "none" | "memory" | "persistent";
	compressionLevel: number;
	enableServiceWorker: boolean;
	enableBackgroundSync: boolean;
	enableOfflineMode: boolean;
	reduceAnimations: boolean;
	enableDarkMode: boolean;
	fontSize: number;
	touchTargetSize: number;
}

export function MobileOptimization({ className, onOptimizationChange }: MobileOptimizationProps) {
	const t = useTranslations("optimization");
	const { toast } = useToast();

	const [settings, setSettings] = useState<MobileOptimizationSettings>({
		imageQuality: "auto",
		preloadStrategy: "viewport",
		cacheStrategy: "memory",
		compressionLevel: 70,
		enableServiceWorker: true,
		enableBackgroundSync: true,
		enableOfflineMode: false,
		reduceAnimations: false,
		enableDarkMode: false,
		fontSize: 16,
		touchTargetSize: 44,
	});

	const [isApplying, setIsApplying] = useState(false);
	const [optimizationScore, setOptimizationScore] = useState(0);

	const calculateOptimizationScore = useCallback((settings: MobileOptimizationSettings) => {
		let score = 0;

		// Image quality scoring
		const qualityScores = { low: 30, medium: 20, high: 10, auto: 25 };
		score += qualityScores[settings.imageQuality];

		// Preload strategy scoring
		const preloadScores = { none: 0, viewport: 15, aggressive: 10 };
		score += preloadScores[settings.preloadStrategy];

		// Cache strategy scoring
		const cacheScores = { none: 0, memory: 20, persistent: 25 };
		score += cacheScores[settings.cacheStrategy];

		// Compression scoring (higher compression = higher score)
		score += Math.min(settings.compressionLevel / 2, 20);

		// Feature toggles
		if (settings.enableServiceWorker) score += 15;
		if (settings.enableBackgroundSync) score += 10;
		if (settings.enableOfflineMode) score += 15;
		if (settings.reduceAnimations) score += 5;
		if (settings.enableDarkMode) score += 5;

		// Font size optimization (closer to 16px = better)
		const fontScore = Math.max(0, 10 - Math.abs(settings.fontSize - 16));
		score += fontScore;

		// Touch target size (minimum 44px recommended)
		const touchScore = settings.touchTargetSize >= 44 ? 10 : 5;
		score += touchScore;

		return Math.min(Math.round(score), 100);
	}, []);

	const applyOptimizations = useCallback(async () => {
		setIsApplying(true);

		try {
			// Simulate applying optimizations
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Apply settings to document
			const root = document.documentElement;

			// Image quality
			root.style.setProperty("--image-quality", settings.imageQuality);

			// Font size
			root.style.setProperty("--font-size", `${settings.fontSize}px`);

			// Touch target size
			root.style.setProperty("--touch-target-size", `${settings.touchTargetSize}px`);

			// Animations
			if (settings.reduceAnimations) {
				root.style.setProperty("--animation-duration", "0.1s");
			} else {
				root.style.removeProperty("--animation-duration");
			}

			// Dark mode
			if (settings.enableDarkMode) {
				root.classList.add("dark");
			} else {
				root.classList.remove("dark");
			}

			// Service Worker registration (mock)
			if (settings.enableServiceWorker && "serviceWorker" in navigator) {
				// ignored
			}

			// Calculate and update score
			const score = calculateOptimizationScore(settings);
			setOptimizationScore(score);

			onOptimizationChange?.(settings);

			toast({
				title: t("optimizationsApplied"),
				description: t("optimizationScore", { score }),
			});
		} catch (_error) {
			toast({
				title: t("optimizationFailed"),
				description: t("optimizationFailedDescription"),
				variant: "destructive",
			});
		} finally {
			setIsApplying(false);
		}
	}, [settings, calculateOptimizationScore, onOptimizationChange, toast, t]);

	const updateSetting = useCallback(
		<K extends keyof MobileOptimizationSettings>(
			key: K,
			value: MobileOptimizationSettings[K]
		) => {
			setSettings((prev) => ({ ...prev, [key]: value }));
		},
		[]
	);

	const resetToDefaults = useCallback(() => {
		setSettings({
			imageQuality: "auto",
			preloadStrategy: "viewport",
			cacheStrategy: "memory",
			compressionLevel: 70,
			enableServiceWorker: true,
			enableBackgroundSync: true,
			enableOfflineMode: false,
			reduceAnimations: false,
			enableDarkMode: false,
			fontSize: 16,
			touchTargetSize: 44,
		});
	}, []);

	const exportSettings = useCallback(() => {
		const dataStr = JSON.stringify(settings, null, 2);
		const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

		const exportFileDefaultName = `mobile-optimization-${new Date().toISOString().split("T")[0]}.json`;

		const linkElement = document.createElement("a");
		linkElement.setAttribute("href", dataUri);
		linkElement.setAttribute("download", exportFileDefaultName);
		linkElement.click();

		toast({
			title: t("settingsExported"),
			description: t("settingsExportedDescription"),
		});
	}, [settings, toast, t]);

	const importSettings = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const importedSettings = JSON.parse(e.target?.result as string);
					setSettings(importedSettings);
					toast({
						title: t("settingsImported"),
						description: t("settingsImportedDescription"),
					});
				} catch (_error) {
					toast({
						title: t("importFailed"),
						description: t("importFailedDescription"),
						variant: "destructive",
					});
				}
			};
			reader.readAsText(file);
		},
		[toast, t]
	);

	useEffect(() => {
		const score = calculateOptimizationScore(settings);
		setOptimizationScore(score);
	}, [settings, calculateOptimizationScore]);

	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-500";
		if (score >= 60) return "text-yellow-500";
		return "text-red-500";
	};

	const getScoreBadge = (score: number) => {
		if (score >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
		if (score >= 60) return <Badge className="bg-yellow-500">Good</Badge>;
		return <Badge variant="destructive">Needs Improvement</Badge>;
	};

	return (
		<div className={cn("space-y-4", className)}>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="h-5 w-5" />
						{t("mobileOptimization")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-3xl font-bold">{optimizationScore}</p>
							<p className="text-sm text-muted-foreground">
								{t("optimizationScore")}
							</p>
						</div>
						{getScoreBadge(optimizationScore)}
					</div>
					<div className="mt-4">
						<div className="flex items-center justify-between text-sm mb-2">
							<span>0</span>
							<span className={getScoreColor(optimizationScore)}>
								{optimizationScore}
							</span>
							<span>100</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className={cn("h-2 rounded-full transition-all", {
									"bg-green-500": optimizationScore >= 80,
									"bg-yellow-500": optimizationScore >= 60,
									"bg-red-500": optimizationScore < 60,
								})}
								style={{ width: `${optimizationScore}%` }}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						{t("performanceSettings")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<label className="text-sm font-medium">{t("imageQuality")}</label>
						<Select
							value={settings.imageQuality}
							onValueChange={(value) =>
								updateSetting(
									"imageQuality",
									value as MobileOptimizationSettings["imageQuality"]
								)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="auto">{t("auto")}</SelectItem>
								<SelectItem value="high">{t("high")}</SelectItem>
								<SelectItem value="medium">{t("medium")}</SelectItem>
								<SelectItem value="low">{t("low")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">{t("preloadStrategy")}</label>
						<Select
							value={settings.preloadStrategy}
							onValueChange={(value) =>
								updateSetting(
									"preloadStrategy",
									value as MobileOptimizationSettings["preloadStrategy"]
								)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="viewport">{t("viewport")}</SelectItem>
								<SelectItem value="aggressive">{t("aggressive")}</SelectItem>
								<SelectItem value="none">{t("none")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">{t("cacheStrategy")}</label>
						<Select
							value={settings.cacheStrategy}
							onValueChange={(value) =>
								updateSetting(
									"cacheStrategy",
									value as MobileOptimizationSettings["cacheStrategy"]
								)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="persistent">{t("persistent")}</SelectItem>
								<SelectItem value="memory">{t("memory")}</SelectItem>
								<SelectItem value="none">{t("none")}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-sm font-medium">{t("compressionLevel")}</label>
							<span className="text-sm text-muted-foreground">
								{settings.compressionLevel}%
							</span>
						</div>
						<Slider
							value={[settings.compressionLevel]}
							onValueChange={([value]) => updateSetting("compressionLevel", value)}
							max={100}
							min={0}
							step={5}
							className="w-full"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						{t("featureToggles")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<span className="text-sm">{t("serviceWorker")}</span>
						<Switch
							checked={settings.enableServiceWorker}
							onCheckedChange={(checked) =>
								updateSetting("enableServiceWorker", checked)
							}
						/>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm">{t("backgroundSync")}</span>
						<Switch
							checked={settings.enableBackgroundSync}
							onCheckedChange={(checked) =>
								updateSetting("enableBackgroundSync", checked)
							}
						/>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm">{t("offlineMode")}</span>
						<Switch
							checked={settings.enableOfflineMode}
							onCheckedChange={(checked) =>
								updateSetting("enableOfflineMode", checked)
							}
						/>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm">{t("reduceAnimations")}</span>
						<Switch
							checked={settings.reduceAnimations}
							onCheckedChange={(checked) =>
								updateSetting("reduceAnimations", checked)
							}
						/>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm">{t("darkMode")}</span>
						<Switch
							checked={settings.enableDarkMode}
							onCheckedChange={(checked) => updateSetting("enableDarkMode", checked)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("accessibilitySettings")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-sm font-medium">{t("fontSize")}</label>
							<span className="text-sm text-muted-foreground">
								{settings.fontSize}px
							</span>
						</div>
						<Slider
							value={[settings.fontSize]}
							onValueChange={([value]) => updateSetting("fontSize", value)}
							max={24}
							min={12}
							step={1}
							className="w-full"
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-sm font-medium">{t("touchTargetSize")}</label>
							<span className="text-sm text-muted-foreground">
								{settings.touchTargetSize}px
							</span>
						</div>
						<Slider
							value={[settings.touchTargetSize]}
							onValueChange={([value]) => updateSetting("touchTargetSize", value)}
							max={60}
							min={32}
							step={2}
							className="w-full"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<div className="flex gap-2">
						<Button
							onClick={applyOptimizations}
							disabled={isApplying}
							className="flex-1"
						>
							{isApplying ? (
								<>
									<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
									{t("applying")}
								</>
							) : (
								<>
									<Zap className="h-4 w-4 mr-2" />
									{t("applyOptimizations")}
								</>
							)}
						</Button>
						<Button variant="outline" onClick={resetToDefaults}>
							{t("resetDefaults")}
						</Button>
					</div>

					<div className="flex gap-2 mt-2">
						<Button variant="outline" onClick={exportSettings} className="flex-1">
							<Download className="h-4 w-4 mr-2" />
							{t("exportSettings")}
						</Button>
						<label className="flex-1">
							<Button variant="outline" className="w-full" asChild={true}>
								<span>
									<Upload className="h-4 w-4 mr-2" />
									{t("importSettings")}
								</span>
							</Button>
							<input
								type="file"
								accept=".json"
								onChange={importSettings}
								className="hidden"
							/>
						</label>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
