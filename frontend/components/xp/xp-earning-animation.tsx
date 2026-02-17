"use client";

import { useState, useEffect } from "react";
import { Star, Trophy, Zap, Target, TrendingUp, PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface XPEarningAnimationProps {
	xpGained: number;
	reason: string;
	currentXP: number;
	nextLevelXP: number;
	level: number;
	onComplete?: () => void;
	duration?: number;
}

export function XPEarningAnimation({
	xpGained,
	reason,
	currentXP,
	nextLevelXP,
	level,
	onComplete,
	duration = 3000,
}: XPEarningAnimationProps) {
	const t = useTranslations("xp");
	const { toast } = useToast();
	const [animatedXP, setAnimatedXP] = useState(0);
	const [showAnimation, setShowAnimation] = useState(true);
	const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

	useEffect(() => {
		// Animate XP counter
		const startTime = Date.now();
		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function for smooth animation
			const easeOut = 1 - (1 - progress) ** 3;
			setAnimatedXP(Math.floor(xpGained * easeOut));

			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				// Animation complete
				setTimeout(() => {
					setShowAnimation(false);
					onComplete?.();
				}, 1000);
			}
		};

		// Create floating particles
		const particleCount = Math.min(xpGained / 10, 20);
		const newParticles = Array.from({ length: particleCount }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 100,
		}));
		setParticles(newParticles);

		animate();

		// Show toast notification
		toast({
			title: t("xpEarned"),
			description: t("xpEarnedDesc", { xp: xpGained, reason }),
		});
	}, [xpGained, reason, duration, onComplete, toast, t]);

	const progressPercentage = ((currentXP + animatedXP) / nextLevelXP) * 100;
	const isLevelUp = currentXP + xpGained >= nextLevelXP;

	const getXPColor = (xp: number) => {
		if (xp >= 500) return "text-purple-600";
		if (xp >= 200) return "text-blue-600";
		if (xp >= 100) return "text-green-600";
		return "text-yellow-600";
	};

	const getXPIcon = (xp: number) => {
		if (xp >= 500) return <Trophy className="h-6 w-6" />;
		if (xp >= 200) return <Target className="h-6 w-6" />;
		if (xp >= 100) return <Zap className="h-6 w-6" />;
		return <Star className="h-6 w-6" />;
	};

	if (!showAnimation) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<Card className="w-full max-w-md mx-4">
				<CardContent className="pt-6">
					<div className="text-center space-y-6">
						<div className="absolute inset-0 overflow-hidden pointer-events-none">
							{particles.map((particle) => (
								<div
									key={particle.id}
									className="absolute animate-bounce"
									style={{
										left: `${particle.x}%`,
										top: `${particle.y}%`,
										animationDelay: `${particle.id * 0.1}s`,
										animationDuration: "2s",
									}}
								>
									<Star className="h-3 w-3 text-yellow-400 opacity-60" />
								</div>
							))}
						</div>

						<div
							className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg animate-pulse ${getXPColor(xpGained)}`}
						>
							{getXPIcon(xpGained)}
						</div>

						<div className="space-y-2">
							<div
								className={`text-4xl font-bold animate-bounce ${getXPColor(xpGained)}`}
							>
								+{animatedXP} XP
							</div>
							<p className="text-muted-foreground">{reason}</p>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span>
									{t("level")} {level}
								</span>
								<span>
									{Math.min(currentXP + animatedXP, nextLevelXP)} / {nextLevelXP}{" "}
									XP
								</span>
							</div>
							<Progress value={Math.min(progressPercentage, 100)} className="h-3" />
							{isLevelUp && (
								<Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse">
									<TrendingUp className="h-3 w-3 mr-1" />
									{t("levelUp")}
								</Badge>
							)}
						</div>

						{isLevelUp && (
							<div className="space-y-2 animate-bounce">
								<PartyPopper className="h-8 w-8 text-purple-500" />
								<p className="text-lg font-semibold text-purple-600">
									{t("congratulations")}
								</p>
								<p className="text-sm text-muted-foreground">
									{t("levelUpDesc", { level: level + 1 })}
								</p>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="text-center p-3 bg-muted rounded-lg">
								<div className="font-medium">{t("totalXP")}</div>
								<div className="text-2xl font-bold text-blue-600">
									{currentXP + animatedXP}
								</div>
							</div>
							<div className="text-center p-3 bg-muted rounded-lg">
								<div className="font-medium">{t("nextLevel")}</div>
								<div className="text-2xl font-bold text-green-600">
									{Math.max(0, nextLevelXP - (currentXP + animatedXP))}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Hook for triggering XP animations
export function useXPAnimation() {
	const [animations, setAnimations] = useState<XPEarningAnimationProps[]>([]);

	const triggerXPAnimation = (props: Omit<XPEarningAnimationProps, "onComplete">) => {
		const animation: XPEarningAnimationProps = {
			...props,
			onComplete: () => {
				setAnimations((prev) => prev.filter((a) => a !== animation));
			},
		};

		setAnimations((prev) => [...prev, animation]);

		// Auto-remove after duration + buffer
		setTimeout(
			() => {
				setAnimations((prev) => prev.filter((a) => a !== animation));
			},
			(props.duration || 3000) + 2000
		);
	};

	return {
		triggerXPAnimation,
		XPAnimations: animations.map((animation, index) => (
			<XPEarningAnimation key={index} {...animation} />
		)),
	};
}
