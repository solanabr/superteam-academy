"use client";

import { useState, useEffect } from "react";
import { Trophy, Star, Target, Zap, Award, CheckCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

const getRarityColor = (rarity: string) => {
	switch (rarity) {
		case "common":
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		case "rare":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
		case "epic":
			return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
		case "legendary":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
	}
};

const getCategoryIcon = (category: string) => {
	switch (category) {
		case "learning":
			return <Award className="h-8 w-8" />;
		case "social":
			return <Star className="h-8 w-8" />;
		case "challenge":
			return <Target className="h-8 w-8" />;
		case "streak":
			return <Zap className="h-8 w-8" />;
		case "special":
			return <Trophy className="h-8 w-8" />;
		default:
			return <Award className="h-8 w-8" />;
	}
};

interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: string;
	category: "learning" | "social" | "challenge" | "streak" | "special";
	rarity: "common" | "rare" | "epic" | "legendary";
	xpReward: number;
	progress: number;
	maxProgress: number;
	unlockedAt?: Date;
	requirements: string[];
}

interface AchievementUnlockingProps {
	achievement: Achievement;
	onClose?: () => void;
	onShare?: (achievement: Achievement) => void;
	autoClose?: boolean;
	duration?: number;
}

export function AchievementUnlocking({
	achievement,
	onClose,
	onShare,
	autoClose = true,
	duration = 5000,
}: AchievementUnlockingProps) {
	const t = useTranslations("achievements");
	const { toast } = useToast();
	const [showAnimation, setShowAnimation] = useState(true);
	const [particles, setParticles] = useState<
		Array<{ id: number; x: number; y: number; delay: number }>
	>([]);

	useEffect(() => {
		// Create celebration particles
		const particleCount = 20;
		const newParticles = Array.from({ length: particleCount }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 100,
			delay: Math.random() * 2,
		}));
		setParticles(newParticles);

		// Auto-close after duration
		if (autoClose) {
			const timer = setTimeout(() => {
				setShowAnimation(false);
				onClose?.();
			}, duration);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [autoClose, duration, onClose]);

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "learning":
				return "text-blue-600";
			case "social":
				return "text-green-600";
			case "challenge":
				return "text-red-600";
			case "streak":
				return "text-orange-600";
			case "special":
				return "text-purple-600";
			default:
				return "text-gray-600";
		}
	};

	const handleShare = () => {
		const shareText = t("shareAchievement", {
			title: achievement.title,
			rarity: t(achievement.rarity),
		});

		if (navigator.share) {
			navigator
				.share({
					title: achievement.title,
					text: shareText,
				})
				.catch(() => {
					// Fallback to clipboard
					navigator.clipboard.writeText(shareText);
					toast({
						title: t("copiedToClipboard"),
						description: t("achievementLinkCopied"),
					});
				});
		} else {
			navigator.clipboard.writeText(shareText);
			toast({
				title: t("copiedToClipboard"),
				description: t("achievementLinkCopied"),
			});
		}

		onShare?.(achievement);
	};

	if (!showAnimation) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<Card className="w-full max-w-md mx-4 relative">
				<Button
					variant="ghost"
					size="sm"
					className="absolute top-2 right-2 z-10"
					onClick={() => {
						setShowAnimation(false);
						onClose?.();
					}}
				>
					<X className="h-4 w-4" />
				</Button>

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
									<Star className="h-2 w-2 text-yellow-400 opacity-60" />
								</div>
							))}
						</div>

						<div
							className={`mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg animate-bounce ${getCategoryColor(achievement.category)}`}
						>
							{getCategoryIcon(achievement.category)}
						</div>

						<div className="space-y-2">
							<div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
								{t("achievementUnlocked")}
							</div>
							<h2 className="text-2xl font-bold">{achievement.title}</h2>
							<p className="text-muted-foreground">{achievement.description}</p>
						</div>

						<div className="flex items-center justify-center gap-4">
							<Badge className={getRarityColor(achievement.rarity)}>
								{t(achievement.rarity)}
							</Badge>
							<div className="flex items-center gap-1 text-yellow-600">
								<Star className="h-4 w-4" />
								<span className="font-medium">+{achievement.xpReward} XP</span>
							</div>
						</div>

						{achievement.maxProgress > 1 && (
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>{t("progress")}</span>
									<span>
										{achievement.progress}/{achievement.maxProgress}
									</span>
								</div>
								<Progress
									value={(achievement.progress / achievement.maxProgress) * 100}
									className="h-2"
								/>
							</div>
						)}

						{achievement.requirements.length > 0 && (
							<div className="space-y-2">
								<h3 className="text-sm font-medium">{t("requirements")}</h3>
								<div className="space-y-1">
									{achievement.requirements.map((requirement, index) => (
										<div
											key={index}
											className="flex items-center gap-2 text-sm"
										>
											<CheckCircle className="h-4 w-4 text-green-600" />
											<span>{requirement}</span>
										</div>
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

// Hook for managing achievement notifications
export function useAchievementNotifications() {
	const [notifications, setNotifications] = useState<Achievement[]>([]);

	const showAchievement = (achievement: Achievement) => {
		setNotifications((prev) => [...prev, achievement]);

		// Auto-remove after animation
		setTimeout(() => {
			setNotifications((prev) => prev.filter((a) => a.id !== achievement.id));
		}, 6000); // Slightly longer than animation duration
	};

	const dismissAchievement = (achievementId: string) => {
		setNotifications((prev) => prev.filter((a) => a.id !== achievementId));
	};

	return {
		showAchievement,
		dismissAchievement,
		achievementNotifications: notifications.map((achievement) => (
			<AchievementUnlocking
				key={achievement.id}
				achievement={achievement}
				onClose={() => dismissAchievement(achievement.id)}
			/>
		)),
	};
}

// Achievement progress component
interface AchievementProgressProps {
	achievement: Achievement;
	showDetails?: boolean;
}

export function AchievementProgress({
	achievement,
	showDetails = false,
}: AchievementProgressProps) {
	const t = useTranslations("achievements");
	const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

	return (
		<Card
			className={`transition-all ${achievement.unlockedAt ? "ring-2 ring-yellow-400" : ""}`}
		>
			<CardContent className="pt-4">
				<div className="flex items-start gap-3">
					<div
						className={`p-2 rounded-lg ${achievement.unlockedAt ? "bg-yellow-100 dark:bg-yellow-900" : "bg-muted"}`}
					>
						{getCategoryIcon(achievement.category)}
					</div>
					<div className="flex-1 space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="font-medium">{achievement.title}</h3>
							<Badge className={getRarityColor(achievement.rarity)}>
								{t(achievement.rarity)}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground">{achievement.description}</p>

						<div className="space-y-1">
							<div className="flex justify-between text-sm">
								<span>{t("progress")}</span>
								<span>
									{achievement.progress}/{achievement.maxProgress}
								</span>
							</div>
							<Progress value={progressPercentage} className="h-2" />
						</div>

						{showDetails && achievement.requirements.length > 0 && (
							<div className="space-y-1">
								<h4 className="text-sm font-medium">{t("requirements")}</h4>
								{achievement.requirements.map((requirement, index) => (
									<div key={index} className="flex items-center gap-2 text-sm">
										{achievement.progress > index ? (
											<CheckCircle className="h-3 w-3 text-green-600" />
										) : (
											<div className="h-3 w-3 rounded-full border-2 border-muted-foreground" />
										)}
										<span
											className={
												achievement.progress > index
													? ""
													: "text-muted-foreground"
											}
										>
											{requirement}
										</span>
									</div>
								))}
							</div>
						)}

						{achievement.unlockedAt && (
							<div className="flex items-center gap-1 text-sm text-green-600">
								<Trophy className="h-3 w-3" />
								<span>
									{t("unlocked")} {achievement.unlockedAt.toLocaleDateString()}
								</span>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
