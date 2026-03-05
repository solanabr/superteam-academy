/**
 * @fileoverview Main dashboard view component, assembling user stats, course progress, and activity feed.
 */

"use client";

import { CaretRight } from "@phosphor-icons/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AchievementGrid } from "@/components/dashboard/AchievementGrid";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { RecommendedCourseCard } from "@/components/dashboard/RecommendedCourseCard";
import { StreakCalendar } from "@/components/dashboard/StreakCalendar";
import { UserHUD } from "@/components/dashboard/UserHUD";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { type Achievement } from "@/lib/data/achievement-definitions";
import { type ActivityItem } from "@/lib/data/activity";
import {
	type CourseProgress,
	type RecommendedCourse,
	type UserStats,
} from "@/lib/data/user";
import { useOnchainStats } from "@/lib/hooks/use-onchain-stats";

/** Dashboard view props. */
interface DashboardViewProps {
	userStats: UserStats;
	activeCourses: CourseProgress[];
	recommendedCourses: RecommendedCourse[];
	achievements: Achievement[];
	recentActivity: ActivityItem[];
	fullHistory: ActivityItem[];
}

/**
 * DashboardView Component
 * The central hub for the user, displaying their progress, next steps, and social status.
 * Merges server-side stats with real-time on-chain data for accurate XP/Level display.
 */
export function DashboardView({
	userStats,
	activeCourses,
	recommendedCourses,
	achievements,
	recentActivity,
	fullHistory,
}: DashboardViewProps) {
	const t = useTranslations("Dashboard");
	const [isTerminalOpen, setIsTerminalOpen] = useState(false);
	const [terminalFilter, setTerminalFilter] = useState<
		"all" | "lessons" | "achievements"
	>("all");
	const { publicKey } = useWallet();
	const onchainStats = useOnchainStats(publicKey?.toString());
	const terminalEndRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom of terminal when opened
	useEffect(() => {
		if (isTerminalOpen) {
			const timeout = setTimeout(() => {
				terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
			}, 100);
			return () => clearTimeout(timeout);
		}
	}, [isTerminalOpen]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "F1") {
				e.preventDefault();
				setIsTerminalOpen((prev) => !prev);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Merge on-chain real-time data with server-side stats
	const displayStats = {
		...userStats,
		xp: onchainStats.loading ? userStats.xp : onchainStats.xp,
		level: onchainStats.loading ? userStats.level : onchainStats.level,
		levelProgress: onchainStats.loading
			? userStats.levelProgress
			: onchainStats.levelProgress,
		xpToNextLevel: onchainStats.loading
			? userStats.xpToNextLevel
			: onchainStats.xpToNextLevel,
	};
	return (
		<div className="min-h-screen bg-bg-base">
			{/* App Shell Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_350px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full">
				{/* Top Bar - spans all columns */}
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				{/* Nav Rail */}
				<NavRail />

				{/* Main Stage */}
				<section className="p-4 lg:p-8 overflow-visible lg:overflow-y-auto flex flex-col gap-10">
					{/* Active Courses */}
					<div>
						<div className="flex justify-between items-end mb-6 border-b border-ink-secondary/20 dark:border-border pb-2">
							<div>
								<span className="bg-ink-primary text-bg-base px-2 py-1 text-[10px] uppercase tracking-widest inline-block mb-2">
									Current Operations
								</span>
								<h2 className="font-display text-2xl lg:text-[32px] leading-none -tracking-wider">
									ACTIVE COURSES
								</h2>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{activeCourses.map((course) => (
								<CourseCard key={course.courseId} course={course} />
							))}
						</div>
					</div>

					{/* Recommended Tracks */}
					<div>
						<div className="flex justify-between items-end mb-6 border-b border-border pb-2">
							<div>
								<span className="bg-ink-primary text-bg-base px-2 py-1 text-[10px] uppercase tracking-widest inline-block mb-2">
									Next Targets
								</span>
								<h2 className="font-display text-2xl lg:text-[32px] leading-none -tracking-wider">
									RECOMMENDED TRACKS
								</h2>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{recommendedCourses.map((course) => (
								<RecommendedCourseCard key={course.id} course={course} />
							))}
						</div>
					</div>

					{/* Recent Activity */}
					<div>
						<div className="flex justify-between items-end mb-6 border-b border-border pb-2">
							<div>
								<span className="bg-ink-primary text-bg-base px-2 py-1 text-[10px] uppercase tracking-widest inline-block mb-2">
									{t("recentActivity.label")}
								</span>
								<h2 className="font-display text-2xl lg:text-[32px] leading-none -tracking-wider">
									{t("recentActivity.title")}
								</h2>
							</div>
							<button
								onClick={() => setIsTerminalOpen(true)}
								className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-ink-secondary hover:text-ink-primary transition-colors mb-2"
							>
								{t("recentActivity.viewAllLogs")}{" "}
								<CaretRight weight="bold" size={14} />
							</button>
						</div>
						<ActivityFeed activities={recentActivity} />
					</div>
				</section>

				{/* Context Panel (Right Sidebar) */}
				<aside className="border-t lg:border-t-0 lg:border-l border-ink-secondary/20 dark:border-border bg-bg-base p-6 flex flex-col gap-8 overflow-visible lg:overflow-y-auto">
					<UserHUD stats={displayStats} />

					<StreakCalendar streak={displayStats.streak} />

					<AchievementGrid achievements={achievements} />

					<Sheet open={isTerminalOpen} onOpenChange={setIsTerminalOpen}>
						<SheetTrigger asChild>
							<Button className="bg-ink-primary text-bg-base hover:bg-ink-primary/90 rounded-none uppercase text-[11px] font-bold px-4 py-2 h-auto tracking-widest w-full justify-center mt-auto transition-transform active:scale-95">
								{t("logs.button")}
							</Button>
						</SheetTrigger>
						<SheetContent
							side="bottom"
							className="h-[50vh] bg-bg-base border-t border-border p-0 font-mono flex flex-col"
							showCloseButton={false}
						>
							<div className="bg-ink-secondary/10 px-4 py-2 text-[10px] tracking-widest uppercase border-b border-border flex justify-between items-center text-ink-secondary shrink-0">
								<div className="flex items-center gap-4 text-ink-primary font-bold">
									<span>{t("logs.title")}</span>
									<div className="flex items-center gap-2 border-l border-ink-secondary/30 pl-4 h-3">
										<button
											onClick={() => setTerminalFilter("all")}
											className={`${terminalFilter === "all" ? "text-ink-primary" : "text-ink-secondary opacity-50 hover:opacity-100"} transition-colors`}
										>
											{t("logs.tabs.all")}
										</button>
										<button
											onClick={() => setTerminalFilter("lessons")}
											className={`${terminalFilter === "lessons" ? "text-ink-primary" : "text-ink-secondary opacity-50 hover:opacity-100"} transition-colors`}
										>
											{t("logs.tabs.lessons")}
										</button>
										<button
											onClick={() => setTerminalFilter("achievements")}
											className={`${terminalFilter === "achievements" ? "text-ink-primary" : "text-ink-secondary opacity-50 hover:opacity-100"} transition-colors`}
										>
											{t("logs.tabs.achievements")}
										</button>
									</div>
								</div>
								<span>{t("logs.version")}</span>
							</div>
							<div className="p-4 overflow-y-auto text-ink-primary text-sm flex-1 custom-scrollbar flex flex-col justify-start">
								<div className="space-y-2">
									{[...fullHistory]
										.filter((activity) => {
											if (terminalFilter === "lessons")
												return (
													activity.type.includes("lesson") ||
													activity.type.includes("course")
												);
											if (terminalFilter === "achievements")
												return (
													activity.type === "achievement" ||
													activity.type === "level_up"
												);
											return true;
										})
										.map((activity, index) => (
											<div
												key={activity.id || index}
												className="flex gap-4 hover:bg-ink-primary/5 p-1 -mx-1 rounded"
											>
												<span className="text-ink-secondary opacity-50 shrink-0">
													[{new Date(activity.timestamp).toLocaleDateString()}{" "}
													{new Date(activity.timestamp).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
													]
												</span>
												<span className="text-ink-secondary uppercase w-32 shrink-0 hidden sm:block">
													{activity.type.replace("_", " ")}
												</span>
												<span className="flex-1 truncate">
													{activity.title}
												</span>
												{activity.xpEarned && (
													<span className="text-success min-w-[50px] text-right font-bold">
														+{activity.xpEarned} XP
													</span>
												)}
											</div>
										))}
									{fullHistory.length === 0 && (
										<div className="text-ink-secondary opacity-50">
											{t("logs.emptyState")}
										</div>
									)}
								</div>
								<div ref={terminalEndRef} />
							</div>
						</SheetContent>
					</Sheet>
				</aside>
			</div>
		</div>
	);
}
