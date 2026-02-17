"use client";

import { useState, useEffect } from "react";
import { Flame, Trophy, Star, Gift, Medal, Gem, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

const getRarityColor = (rarity: string): string => {
	switch (rarity) {
		case "bronze":
			return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
		case "silver":
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		case "gold":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
		case "diamond":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
	}
};

interface StreakMilestone {
	days: number;
	title: string;
	description: string;
	rewards: {
		xp: number;
		badges?: string[];
		specialItems?: string[];
	};
	rarity: "bronze" | "silver" | "gold" | "diamond";
}

interface StreakCelebrationProps {
	currentStreak: number;
	milestone: StreakMilestone;
	onClose?: () => void;
	onClaim?: (milestone: StreakMilestone) => void;
	autoClose?: boolean;
	duration?: number;
}

export function StreakCelebration({
	currentStreak,
	milestone,
	onClose,
	onClaim,
	autoClose = true,
	duration = 6000,
}: StreakCelebrationProps) {
	const t = useTranslations("streaks");
	const { toast } = useToast();
	const [showAnimation, setShowAnimation] = useState(true);
	const [fireParticles, setFireParticles] = useState<
		Array<{ id: number; x: number; y: number; delay: number }>
	>([]);
	const [claimed, setClaimed] = useState(false);

	useEffect(() => {
		// Create fire particles for streak celebration
		const particleCount = 30;
		const newParticles = Array.from({ length: particleCount }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 100,
			delay: Math.random() * 3,
		}));
		setFireParticles(newParticles);

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

	const getRarityIcon = (rarity: string) => {
		switch (rarity) {
			case "bronze":
				return <Medal className="h-5 w-5 text-amber-700" />;
			case "silver":
				return <Medal className="h-5 w-5 text-gray-400" />;
			case "gold":
				return <Trophy className="h-5 w-5 text-yellow-500" />;
			case "diamond":
				return <Gem className="h-5 w-5 text-blue-400" />;
			default:
				return <Flame className="h-5 w-5 text-orange-500" />;
		}
	};

	const handleClaim = () => {
		setClaimed(true);
		toast({
			title: t("rewardsClaimed"),
			description: t("rewardsClaimedDesc", { xp: milestone.rewards.xp }),
		});
		onClaim?.(milestone);

		// Auto-close after claiming
		setTimeout(() => {
			setShowAnimation(false);
			onClose?.();
		}, 2000);
	};

	if (!showAnimation) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<Card className="w-full max-w-lg mx-4 relative">
				<CardContent className="pt-6">
					<div className="text-center space-y-6">
						<div className="absolute inset-0 overflow-hidden pointer-events-none">
							{fireParticles.map((particle) => (
								<div
									key={particle.id}
									className="absolute animate-bounce"
									style={{
										left: `${particle.x}%`,
										top: `${particle.y}%`,
										animationDelay: `${particle.delay}s`,
										animationDuration: "2s",
									}}
								>
									<Flame className="h-3 w-3 text-orange-400 opacity-70" />
								</div>
							))}
						</div>

						<div className="relative">
							<div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-yellow-500 flex items-center justify-center shadow-2xl animate-pulse">
								<Flame className="h-16 w-16 text-white animate-bounce" />
							</div>
							<div className="absolute -top-2 -right-2 text-2xl animate-spin">
								{getRarityIcon(milestone.rarity)}
							</div>
						</div>

						<div className="space-y-2">
							<div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
								{t("streakMilestone")}
							</div>
							<h2 className="text-3xl font-bold flex items-center justify-center gap-2">
								<Flame className="h-8 w-8 text-orange-500" />
								{currentStreak} {t("dayStreak")}
							</h2>
							<p className="text-xl font-semibold text-orange-600">
								{milestone.title}
							</p>
							<p className="text-muted-foreground">{milestone.description}</p>
						</div>

						<Badge className={`${getRarityColor(milestone.rarity)} text-lg px-4 py-2`}>
							{t(milestone.rarity)} {t("milestone")}
						</Badge>

						<div className="space-y-4">
							<h3 className="text-lg font-semibold flex items-center justify-center gap-2">
								<Gift className="h-5 w-5 text-green-600" />
								{t("rewards")}
							</h3>

							<div className="grid grid-cols-1 gap-3">
								<div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
									<Star className="h-5 w-5 text-yellow-600" />
									<span className="font-medium">+{milestone.rewards.xp} XP</span>
								</div>

								{milestone.rewards.badges &&
									milestone.rewards.badges.length > 0 && (
										<div className="space-y-2">
											<div className="text-sm font-medium">{t("badges")}</div>
											<div className="flex flex-wrap justify-center gap-2">
												{milestone.rewards.badges.map((badge, index) => (
													<Badge key={index} variant="secondary">
														{badge}
													</Badge>
												))}
											</div>
										</div>
									)}

								{milestone.rewards.specialItems &&
									milestone.rewards.specialItems.length > 0 && (
										<div className="space-y-2">
											<div className="text-sm font-medium">
												{t("specialItems")}
											</div>
											<div className="flex flex-wrap justify-center gap-2">
												{milestone.rewards.specialItems.map(
													(item, index) => (
														<Badge
															key={index}
															className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
														>
															{item}
														</Badge>
													)
												)}
											</div>
										</div>
									)}
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>{t("currentStreak")}</span>
								<span>
									{currentStreak} {t("days")}
								</span>
							</div>
							<Progress value={75} className="h-2" />
							<p className="text-xs text-muted-foreground">
								{t("nextMilestone", { days: currentStreak + 7 })}
							</p>
						</div>

						<Button
							onClick={handleClaim}
							disabled={claimed}
							className="w-full text-lg py-3"
							size="lg"
						>
							{claimed ? (
								<>
									<CheckCircle className="h-5 w-5 mr-2" />
									{t("claimed")}
								</>
							) : (
								<>
									<Trophy className="h-5 w-5 mr-2" />
									{t("claimRewards")}
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Hook for managing streak celebrations
export function useStreakCelebrations() {
	const [celebrations, setCelebrations] = useState<
		Array<{ id: string; milestone: StreakMilestone; currentStreak: number }>
	>([]);

	const showStreakCelebration = (currentStreak: number, milestone: StreakMilestone) => {
		const id = `streak-${Date.now()}`;
		setCelebrations((prev) => [...prev, { id, milestone, currentStreak }]);

		// Auto-remove after celebration
		setTimeout(() => {
			setCelebrations((prev) => prev.filter((c) => c.id !== id));
		}, 8000); // Longer duration for streak celebrations
	};

	const dismissCelebration = (id: string) => {
		setCelebrations((prev) => prev.filter((c) => c.id !== id));
	};

	return {
		showStreakCelebration,
		dismissCelebration,
		streakCelebrations: celebrations.map((celebration) => (
			<StreakCelebration
				key={celebration.id}
				currentStreak={celebration.currentStreak}
				milestone={celebration.milestone}
				onClose={() => dismissCelebration(celebration.id)}
			/>
		)),
	};
}

// Streak progress component
interface StreakProgressProps {
	currentStreak: number;
	longestStreak: number;
	lastActivityDate: Date;
	milestones: StreakMilestone[];
}

export function StreakProgress({
	currentStreak,
	longestStreak,
	lastActivityDate,
	milestones,
}: StreakProgressProps) {
	const t = useTranslations("streaks");

	const getNextMilestone = () => {
		return milestones.find((m) => m.days > currentStreak) || milestones[milestones.length - 1];
	};

	const nextMilestone = getNextMilestone();
	const progressToNext = nextMilestone ? (currentStreak / nextMilestone.days) * 100 : 100;

	const isStreakActive = () => {
		const today = new Date();
		const lastActivity = new Date(lastActivityDate);
		const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays <= 1;
	};

	const streakActive = isStreakActive();

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-6">
					<div className="text-center space-y-2">
						<div
							className={`inline-flex items-center gap-2 text-4xl font-bold ${
								streakActive ? "text-orange-600" : "text-muted-foreground"
							}`}
						>
							<Flame className={`h-8 w-8 ${streakActive ? "animate-pulse" : ""}`} />
							{currentStreak}
						</div>
						<p className="text-muted-foreground">
							{streakActive ? t("dayStreak") : t("streakBroken")}
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="text-center p-3 bg-muted rounded-lg">
							<div className="text-2xl font-bold text-blue-600">{longestStreak}</div>
							<div className="text-sm text-muted-foreground">
								{t("longestStreak")}
							</div>
						</div>
						<div className="text-center p-3 bg-muted rounded-lg">
							<div className="text-2xl font-bold text-green-600">
								{lastActivityDate.toLocaleDateString()}
							</div>
							<div className="text-sm text-muted-foreground">{t("lastActivity")}</div>
						</div>
					</div>

					{nextMilestone && (
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-sm font-medium">{t("nextMilestone")}</span>
								<Badge className={getRarityColor(nextMilestone.rarity)}>
									{nextMilestone.days} {t("days")}
								</Badge>
							</div>
							<Progress value={progressToNext} className="h-3" />
							<p className="text-sm text-muted-foreground">
								{nextMilestone.days - currentStreak} {t("daysToGo")}
							</p>
						</div>
					)}

					<div className="space-y-3">
						<h3 className="text-sm font-medium">{t("recentMilestones")}</h3>
						<div className="space-y-2">
							{milestones
								.filter((m) => m.days <= currentStreak)
								.slice(-3)
								.map((milestone) => (
									<div
										key={milestone.days}
										className="flex items-center justify-between p-2 bg-muted rounded"
									>
										<div className="flex items-center gap-2">
											<Flame className="h-4 w-4 text-orange-500" />
											<span className="text-sm font-medium">
												{milestone.days} {t("days")}
											</span>
										</div>
										<Badge className={getRarityColor(milestone.rarity)}>
											{t(milestone.rarity)}
										</Badge>
									</div>
								))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
