/**
 * Premium Content Access Component
 * Manages access control for premium courses and features
 */

"use client";

import type React from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { PremiumContentGate } from "./payment-processor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Crown,
    Lock,
    Star,
    BookOpen,
    Code,
    Trophy,
    Users,
    Clock,
    CheckCircle,
    AlertTriangle,
} from "@/components/lucide-shim";
import { useTranslations } from "next-intl";

interface PremiumCourseAccessProps {
	courseId: string;
	userId: string;
	children: React.ReactNode;
	className?: string;
}

export function PremiumCourseAccess({
	courseId,
	userId,
	children,
	className = "",
}: PremiumCourseAccessProps) {
	const { subscription: _subscription, hasAccessToCourse, loading } = useSubscription(userId);

	if (loading) {
		return (
			<div className="space-y-4">
				<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			</div>
		);
	}

	const hasAccess = hasAccessToCourse(courseId);

	return (
		<PremiumContentGate
			hasAccess={hasAccess}
			requiredPlan="Premium"
			className={className}
			fallback={
				<div className="space-y-6">
					<PremiumUpgradePrompt courseId={courseId} />
					<PremiumPreview courseId={courseId} />
				</div>
			}
		>
			{children}
		</PremiumContentGate>
	);
}

function PremiumUpgradePrompt({ courseId: _courseId }: { courseId: string }) {
	const t = useTranslations("premium");

	return (
		<Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
			<CardHeader>
				<CardTitle className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
					<Crown className="h-5 w-5" />
					<span>{t("upgrade.title")}</span>
				</CardTitle>
				<CardDescription className="text-yellow-700 dark:text-yellow-300">
					{t("upgrade.description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
						<BookOpen className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
						<div className="font-semibold">{t("upgrade.benefits.unlimited")}</div>
						<div className="text-sm text-yellow-700 dark:text-yellow-300">
							{t("upgrade.benefits.unlimitedDesc")}
						</div>
					</div>
					<div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
						<Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
						<div className="font-semibold">{t("upgrade.benefits.certificates")}</div>
						<div className="text-sm text-yellow-700 dark:text-yellow-300">
							{t("upgrade.benefits.certificatesDesc")}
						</div>
					</div>
					<div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
						<Users className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
						<div className="font-semibold">{t("upgrade.benefits.support")}</div>
						<div className="text-sm text-yellow-700 dark:text-yellow-300">
							{t("upgrade.benefits.supportDesc")}
						</div>
					</div>
				</div>
				<Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
					<Crown className="h-4 w-4 mr-2" />
					{t("upgrade.button")}
				</Button>
			</CardContent>
		</Card>
	);
}

function PremiumPreview({ courseId: _courseId }: { courseId: string }) {
	const t = useTranslations("premium");

	// Mock course preview data
	const coursePreview = {
		title: "Advanced DeFi Development",
		description: "Master decentralized finance protocols and smart contract development",
		previewLessons: [
			{ title: "Introduction to DeFi", duration: "15 min", locked: false },
			{ title: "Understanding AMMs", duration: "25 min", locked: false },
			{ title: "Building a DEX", duration: "45 min", locked: true },
			{ title: "Liquidity Mining", duration: "30 min", locked: true },
			{ title: "Yield Farming Strategies", duration: "40 min", locked: true },
		],
		totalLessons: 12,
		unlockedLessons: 2,
		difficulty: "Advanced",
		rating: 4.8,
		students: 1250,
	};

	const progressPercentage = (coursePreview.unlockedLessons / coursePreview.totalLessons) * 100;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="flex items-center space-x-2">
							<BookOpen className="h-5 w-5" />
							<span>{coursePreview.title}</span>
							<Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
								<Crown className="h-3 w-3 mr-1" />
								{t("preview.premium")}
							</Badge>
						</CardTitle>
						<CardDescription>{coursePreview.description}</CardDescription>
					</div>
					<div className="text-right">
						<div className="flex items-center space-x-1 text-sm text-gray-500">
							<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
							<span>{coursePreview.rating}</span>
							<span>({coursePreview.students})</span>
						</div>
						<Badge variant="outline">{coursePreview.difficulty}</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div>
						<div className="flex justify-between text-sm mb-2">
							<span>{t("preview.progress")}</span>
							<span>
								{coursePreview.unlockedLessons}/{coursePreview.totalLessons}{" "}
								{t("preview.lessons")}
							</span>
						</div>
						<Progress value={progressPercentage} className="h-2" />
					</div>

					<div className="space-y-2">
						<h4 className="font-medium">{t("preview.lessons")}</h4>
						{coursePreview.previewLessons.map((lesson, index) => (
							<div
								key={index}
								className={`flex items-center justify-between p-3 rounded-lg border ${
									lesson.locked
										? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
										: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
								}`}
							>
								<div className="flex items-center space-x-3">
									{lesson.locked ? (
										<Lock className="h-4 w-4 text-gray-400" />
									) : (
										<CheckCircle className="h-4 w-4 text-green-500" />
									)}
									<span
										className={
											lesson.locked ? "text-gray-600 dark:text-gray-400" : ""
										}
									>
										{lesson.title}
									</span>
								</div>
								<div className="flex items-center space-x-2 text-sm text-gray-500">
									<Clock className="h-3 w-3" />
									<span>{lesson.duration}</span>
									{lesson.locked && (
										<Badge variant="secondary">
											<Crown className="h-3 w-3 mr-1" />
											{t("preview.premium")}
										</Badge>
									)}
								</div>
							</div>
						))}
					</div>

					<Alert>
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>{t("preview.upgradeMessage")}</AlertDescription>
					</Alert>
				</div>
			</CardContent>
		</Card>
	);
}

interface PremiumFeatureGateProps {
	feature: string;
	hasAccess: boolean;
	children: React.ReactNode;
	fallback?: React.ReactNode;
	className?: string;
}

export function PremiumFeatureGate({
	feature,
	hasAccess,
	children,
	fallback,
	className,
}: PremiumFeatureGateProps) {
	const t = useTranslations("premium");

	if (hasAccess) {
		return <>{children}</>;
	}

	if (fallback) {
		return <>{fallback}</>;
	}

	return (
		<div
			className={`text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg ${className}`}
		>
			<Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
			<h4 className="font-medium mb-2">{t("feature.title", { feature })}</h4>
			<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
				{t("feature.description")}
			</p>
			<Button size="sm">
				<Crown className="h-4 w-4 mr-2" />
				{t("feature.upgrade")}
			</Button>
		</div>
	);
}

interface PremiumBadgeProps {
	type?: "course" | "feature" | "content";
	className?: string;
}

export function PremiumBadge({ type = "content", className = "" }: PremiumBadgeProps) {
	const t = useTranslations("premium");

	const badgeConfig = {
		course: {
			icon: BookOpen,
			text: t("badge.course"),
			variant: "default" as const,
		},
		feature: {
			icon: Star,
			text: t("badge.feature"),
			variant: "secondary" as const,
		},
		content: {
			icon: Crown,
			text: t("badge.content"),
			variant: "outline" as const,
		},
	};

	const config = badgeConfig[type];
	const Icon = config.icon;

	return (
		<Badge
			variant={config.variant}
			className={`inline-flex items-center space-x-1 ${className}`}
		>
			<Icon className="h-3 w-3" />
			<span>{config.text}</span>
		</Badge>
	);
}

interface PremiumStatsProps {
	userId: string;
	className?: string;
}

export function PremiumStats({ userId, className = "" }: PremiumStatsProps) {
	const t = useTranslations("premium");
	const { subscription, stats, loading } = useSubscription(userId);

	if (loading || !subscription) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{[...Array(4)].map((_, i) => (
					<div
						key={i}
						className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
					/>
				))}
			</div>
		);
	}

	return (
		<div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center space-x-2">
						<BookOpen className="h-5 w-5 text-blue-500" />
						<div>
							<div className="text-2xl font-bold">{stats.coursesAccessed}</div>
							<div className="text-sm text-gray-500">{t("stats.courses")}</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center space-x-2">
						<Code className="h-5 w-5 text-green-500" />
						<div>
							<div className="text-2xl font-bold">{stats.challengesCompleted}</div>
							<div className="text-sm text-gray-500">{t("stats.challenges")}</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center space-x-2">
						<Trophy className="h-5 w-5 text-yellow-500" />
						<div>
							<div className="text-2xl font-bold">{stats.certificatesEarned}</div>
							<div className="text-sm text-gray-500">{t("stats.certificates")}</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-4">
					<div className="flex items-center space-x-2">
						<Star className="h-5 w-5 text-purple-500" />
						<div>
							<div className="text-2xl font-bold">{stats.daysActive}</div>
							<div className="text-sm text-gray-500">{t("stats.daysActive")}</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
