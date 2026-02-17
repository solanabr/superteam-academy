"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Star, Trophy, Crown, Zap, Gift, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface LevelUpData {
	newLevel: number;
	previousLevel: number;
	xpGained: number;
	totalXP: number;
	rewards: {
		title: string;
		description: string;
		type: "badge" | "unlock" | "bonus" | "title";
		value?: string;
	}[];
	nextLevelXP: number;
}

interface LevelUpProgressionProps {
	levelUpData: LevelUpData;
	onClose?: () => void;
	onShare?: (levelUpData: LevelUpData) => void;
	autoClose?: boolean;
	duration?: number;
}

function getLevelIcon(level: number) {
	if (level >= 50) return <Crown className="h-12 w-12" />;
	if (level >= 25) return <Trophy className="h-12 w-12" />;
	if (level >= 10) return <Star className="h-12 w-12" />;
	return <TrendingUp className="h-12 w-12" />;
}

function getLevelColor(level: number) {
	if (level >= 50) return "text-purple-600";
	if (level >= 25) return "text-yellow-600";
	if (level >= 10) return "text-blue-600";
	return "text-green-600";
}

export function LevelUpProgression({
	levelUpData,
	onClose,
	onShare,
	autoClose = true,
	duration = 7000,
}: LevelUpProgressionProps) {
	const t = useTranslations("levels");
	const { toast } = useToast();
	const [showAnimation, setShowAnimation] = useState(true);
	const [levelNumber, setLevelNumber] = useState(levelUpData.previousLevel);
	const [particles, setParticles] = useState<
		Array<{ id: number; x: number; y: number; delay: number }>
	>([]);

	useEffect(() => {
		// Create celebration particles
		const particleCount = 25;
		const newParticles = Array.from({ length: particleCount }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 100,
			delay: Math.random() * 2,
		}));
		setParticles(newParticles);

		// Animate level number
		const levelTimer = setTimeout(() => {
			setLevelNumber(levelUpData.newLevel);
		}, 1000);

		// Auto-close after duration
		if (autoClose) {
			const closeTimer = setTimeout(() => {
				setShowAnimation(false);
				onClose?.();
			}, duration);
			return () => {
				clearTimeout(levelTimer);
				clearTimeout(closeTimer);
			};
		}

		return () => clearTimeout(levelTimer);
	}, [autoClose, duration, onClose, levelUpData.newLevel]);

	const getRewardIcon = (type: string) => {
		switch (type) {
			case "badge":
				return <Trophy className="h-5 w-5" />;
			case "unlock":
				return <Zap className="h-5 w-5" />;
			case "bonus":
				return <Gift className="h-5 w-5" />;
			case "title":
				return <Crown className="h-5 w-5" />;
			default:
				return <Star className="h-5 w-5" />;
		}
	};

	const handleShare = () => {
		const shareText = t("shareLevelUp", {
			level: levelUpData.newLevel,
			xp: levelUpData.xpGained,
		});

		if (navigator.share) {
			navigator
				.share({
					title: t("levelUp"),
					text: shareText,
				})
				.catch(() => {
					navigator.clipboard.writeText(shareText);
					toast({
						title: t("copiedToClipboard"),
						description: t("levelUpLinkCopied"),
					});
				});
		} else {
			navigator.clipboard.writeText(shareText);
			toast({
				title: t("copiedToClipboard"),
				description: t("levelUpLinkCopied"),
			});
		}

		onShare?.(levelUpData);
	};

	if (!showAnimation) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<Card className="w-full max-w-lg mx-4 relative">
				<CardContent className="pt-6">
					<div className="text-center space-y-6">
						<div className="absolute inset-0 overflow-hidden pointer-events-none">
							{particles.map((particle) => (
								<div
									key={particle.id}
									className="absolute animate-ping"
									style={{
										left: `${particle.x}%`,
										top: `${particle.y}%`,
										animationDelay: `${particle.delay}s`,
										animationDuration: "3s",
									}}
								>
									<Star className="h-3 w-3 text-yellow-400 opacity-60" />
								</div>
							))}
						</div>

						<div className="relative">
							<div
								className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl animate-bounce ${getLevelColor(levelUpData.newLevel)}`}
							>
								{getLevelIcon(levelUpData.newLevel)}
							</div>
							<div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold animate-pulse">
								+
							</div>
						</div>

						<div className="space-y-2">
							<div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
								{t("levelUp")}
							</div>
							<div className="text-6xl font-bold animate-pulse">{levelNumber}</div>
							<p className="text-xl text-muted-foreground">
								{t("congratulationsLevel", { level: levelUpData.newLevel })}
							</p>
						</div>

						<div className="flex items-center justify-center gap-2 text-yellow-600">
							<Star className="h-5 w-5" />
							<span className="text-lg font-medium">
								+{levelUpData.xpGained} XP {t("earned")}
							</span>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>
									{t("level")} {levelUpData.newLevel}
								</span>
								<span>
									{levelUpData.totalXP} / {levelUpData.nextLevelXP} XP
								</span>
							</div>
							<Progress
								value={(levelUpData.totalXP / levelUpData.nextLevelXP) * 100}
								className="h-3"
							/>
						</div>

						{levelUpData.rewards.length > 0 && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold flex items-center justify-center gap-2">
									<Gift className="h-5 w-5 text-green-600" />
									{t("rewards")}
								</h3>

								<div className="space-y-3">
									{levelUpData.rewards.map((reward, index) => (
										<Card key={index} className="border-l-4 border-l-green-500">
											<CardContent className="pt-4">
												<div className="flex items-start gap-3">
													<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
														{getRewardIcon(reward.type)}
													</div>
													<div className="flex-1">
														<h4 className="font-medium">
															{reward.title}
														</h4>
														<p className="text-sm text-muted-foreground">
															{reward.description}
														</p>
														{reward.value && (
															<Badge
																className="mt-1"
																variant="secondary"
															>
																{reward.value}
															</Badge>
														)}
													</div>
													<CheckCircle className="h-5 w-5 text-green-600 mt-1" />
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						)}

						<div className="flex gap-3">
							<Button variant="outline" onClick={handleShare} className="flex-1">
								{t("share")}
							</Button>
							<Button
								onClick={() => {
									setShowAnimation(false);
									onClose?.();
								}}
								className="flex-1"
							>
								{t("continue")}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Hook for managing level-up notifications
export function useLevelUpNotifications() {
	const [notifications, setNotifications] = useState<LevelUpData[]>([]);

	const showLevelUp = (levelUpData: LevelUpData) => {
		setNotifications((prev) => [...prev, levelUpData]);

		// Auto-remove after animation
		setTimeout(() => {
			setNotifications((prev) => prev.filter((n) => n.newLevel !== levelUpData.newLevel));
		}, 8000); // Slightly longer for level-ups
	};

	const dismissLevelUp = (level: number) => {
		setNotifications((prev) => prev.filter((n) => n.newLevel !== level));
	};

	return {
		showLevelUp,
		dismissLevelUp,
		levelUpNotifications: notifications.map((levelUpData) => (
			<LevelUpProgression
				key={levelUpData.newLevel}
				levelUpData={levelUpData}
				onClose={() => dismissLevelUp(levelUpData.newLevel)}
			/>
		)),
	};
}

// Level progress component
interface LevelProgressProps {
	currentLevel: number;
	currentXP: number;
	nextLevelXP: number;
	totalXP: number;
	showDetails?: boolean;
}

export function LevelProgress({
	currentLevel,
	currentXP,
	nextLevelXP,
	totalXP,
	showDetails = false,
}: LevelProgressProps) {
	const t = useTranslations("levels");
	const progressPercentage = ((currentXP % nextLevelXP) / nextLevelXP) * 100;
	const xpToNextLevel = nextLevelXP - (currentXP % nextLevelXP);

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-4">
					<div className="text-center space-y-2">
						<div
							className={`inline-flex items-center gap-2 text-4xl font-bold ${getLevelColor(currentLevel)}`}
						>
							{getLevelIcon(currentLevel)}
							{currentLevel}
						</div>
						<p className="text-muted-foreground">{t("currentLevel")}</p>
					</div>

					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>{t("progressToLevel", { level: currentLevel + 1 })}</span>
							<span>
								{xpToNextLevel} XP {t("toGo")}
							</span>
						</div>
						<Progress value={progressPercentage} className="h-3" />
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div className="text-center p-3 bg-muted rounded-lg">
							<div className="text-xl font-bold text-blue-600">
								{currentXP % nextLevelXP}
							</div>
							<div className="text-xs text-muted-foreground">
								{t("currentLevelXP")}
							</div>
						</div>
						<div className="text-center p-3 bg-muted rounded-lg">
							<div className="text-xl font-bold text-green-600">{nextLevelXP}</div>
							<div className="text-xs text-muted-foreground">{t("nextLevelXP")}</div>
						</div>
						<div className="text-center p-3 bg-muted rounded-lg">
							<div className="text-xl font-bold text-purple-600">{totalXP}</div>
							<div className="text-xs text-muted-foreground">{t("totalXP")}</div>
						</div>
					</div>

					{showDetails && (
						<div className="space-y-2">
							<h3 className="text-sm font-medium">{t("levelBenefits")}</h3>
							<div className="text-sm text-muted-foreground space-y-1">
								<div>• {t("benefit1")}</div>
								<div>• {t("benefit2")}</div>
								<div>• {t("benefit3")}</div>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
