"use client";

import { useEffect } from "react";
import { useAppUser } from "@/hooks/useAppUser";
import { useUserStore } from "@/store/user-store";
import { useAchievementStore } from "@/store/achievement-store";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getRankFromXp, getRankProgress, getLevelFromXp } from "@/lib/ranks";
import { Link } from "@/i18n/routing";
import { Footer } from "@/components/layout/Footer";

export default function DashboardPage() {
    const { user } = useAppUser();

    // Read from Zustand stores directly
    const progress = useUserStore((s) => s.progress);
    const isProgressLoading = useUserStore((s) => s.isProgressLoading);
    const fetchProgress = useUserStore((s) => s.fetchProgress);

    const achievements = useAchievementStore((s) => s.achievements);
    const isAchievementsLoading = useAchievementStore((s) => s.isLoading);
    const fetchAchievements = useAchievementStore((s) => s.fetchAchievements);

    // Fetch progress and achievements when wallet is available
    useEffect(() => {
        if (user?.walletAddress) {
            fetchProgress(user.walletAddress);
            fetchAchievements(user.walletAddress);
        }
    }, [user?.walletAddress, fetchProgress, fetchAchievements]);

    const xp = progress?.xp ?? 0;
    const level = progress?.level ?? getLevelFromXp(xp);
    const currentStreak = progress?.currentStreak ?? 0;
    const longestStreak = progress?.longestStreak ?? 0;
    const rankInfo = getRankFromXp(xp);
    const progressPercent = Math.round(getRankProgress(xp) * 100);

    // Build trophy case from achievements data
    const unlockedCount = achievements.filter((a) => a.claimed).length;
    const totalCount = ACHIEVEMENTS.length;

    // Merge static ACHIEVEMENTS definitions with dynamic claimed status
    const trophyItems = ACHIEVEMENTS.map((def) => {
        const userAchievement = achievements.find((a) => a.id === def.id);
        return {
            ...def,
            claimed: userAchievement?.claimed ?? false,
        };
    });

    const isLoading = isProgressLoading;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 md:px-10 md:py-10 flex flex-col gap-10">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-solana/10 text-solana uppercase tracking-wider border border-solana/20">Cycle 04</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-solana animate-pulse"></span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">Welcome back, {(user?.profile as any)?.displayName || (user?.walletAddress ? "Dev" : "Student")}</h2>
                    <p className="font-mono text-text-muted text-sm flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined notranslate text-sm">wallet</span>
                        Wallet ID: <span className="text-solana/80">{user?.walletAddress ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}` : "Not Connected"}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/courses">
                        <button className="flex items-center gap-2 px-4 py-2 bg-solana/10 hover:bg-solana/20 border border-solana/20 text-solana rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(20,241,149,0.1)] hover:shadow-[0_0_20px_rgba(20,241,149,0.2)]">
                            <span className="material-symbols-outlined notranslate text-lg">code</span>
                            Browse Courses
                        </button>
                    </Link>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* XP Card */}
                <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined notranslate text-4xl text-white">data_usage</span>
                    </div>
                    <p className="text-text-muted text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Total Experience</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h3 className="text-4xl font-mono font-bold text-white">
                            {isLoading ? "..." : xp.toLocaleString()}
                        </h3>
                        <span className="text-solana text-[10px] font-mono bg-solana/10 px-2 py-0.5 rounded">LVL {level}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-solana xp-glow rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>

                {/* Streak Card */}
                <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <span className="material-symbols-outlined notranslate text-4xl text-rust animate-pulse-glow">local_fire_department</span>
                    </div>
                    <p className="text-text-muted text-sm font-display uppercase tracking-widest font-semibold">Current Streak</p>
                    <h3 className="text-4xl font-mono font-bold text-white">
                        {isLoading ? "..." : currentStreak} <span className="text-lg text-text-muted font-normal">Days</span>
                    </h3>
                    <p className="text-xs text-text-muted">
                        {currentStreak >= 7 ? `🔥 Amazing! Longest: ${longestStreak} days` : `Keep it up! ${7 - currentStreak} days to 1 week bonus.`}
                    </p>
                </div>

                {/* Rank Card */}
                <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <span className="material-symbols-outlined notranslate text-4xl text-white">military_tech</span>
                    </div>
                    <p className="text-text-muted text-sm font-display uppercase tracking-widest font-semibold">Current Rank</p>
                    <h3 className={`text-4xl font-display font-bold ${rankInfo.color}`}>
                        {isLoading ? "..." : rankInfo.name}
                    </h3>
                    <p className="text-xs text-text-muted">
                        {rankInfo.nextRank ? `Next Rank: ${rankInfo.nextRank} (${rankInfo.nextXp?.toLocaleString()} XP)` : "Max rank achieved!"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column (2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Active Course Card */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-display font-semibold text-white">Active Course</h3>
                            <Link className="text-xs font-mono text-solana hover:underline" href="/courses">View All Courses -&gt;</Link>
                        </div>
                        <div className="glass-panel rounded-2xl p-1 border border-white/10 group glass-card-hover transition-all duration-300">
                            <div className="relative flex flex-col md:flex-row h-full rounded-xl overflow-hidden bg-void/40">
                                {/* Visual representation */}
                                <div className="w-full md:w-1/3 min-h-[160px] relative overflow-hidden bg-gradient-to-br from-void to-gray-900 border-r border-white/5">
                                    <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 z-10">
                                        <div className="flex gap-2 mb-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-rust/20 text-rust border border-rust/30 font-mono">INTERMEDIATE</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white border border-white/10 font-mono">RUST</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-2xl font-display font-bold text-white leading-tight mb-1">Rust Fundamentals: Memory Safety</h4>
                                        <span className="font-mono text-solana text-lg font-bold">42%</span>
                                    </div>
                                    <p className="text-text-muted text-sm mb-6 max-w-md">Master ownership, borrowing, and lifetimes. The core concepts that make Rust unique and powerful.</p>
                                    <div className="flex flex-col gap-4">
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-solana shadow-[0_0_10px_rgba(20,241,149,0.5)] w-[42%] rounded-full relative">
                                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-text-muted font-mono">Last lesson: Borrow Checker Rules</span>
                                            <button className="px-5 py-2 bg-white text-void font-display font-bold rounded hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2">
                                                Continue
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Activity / Modules */}
                    <section>
                        <h3 className="text-lg font-display font-semibold text-white mb-4">Up Next</h3>
                        <div className="flex flex-col gap-3">
                            {/* Module Item 1 */}
                            <div className="glass-panel p-4 rounded-lg flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group border-l-2 border-l-transparent hover:border-l-solana">
                                <div className="size-10 rounded bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-solana/30 transition-colors">
                                    <span className="material-symbols-outlined text-text-muted group-hover:text-solana">lock_open</span>
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-display font-medium text-white group-hover:text-solana transition-colors text-sm">Understanding The Stack & Heap</h5>
                                    <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Module 03 • 45 min</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white">play_circle</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column (1/3) */}
                <div className="flex flex-col gap-8">
                    {/* Trophy Case - Dynamic */}
                    <section className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-display font-semibold text-white">Trophy Case</h3>
                            <span className="text-xs font-mono text-text-muted">
                                {isAchievementsLoading ? "..." : `${unlockedCount}/${totalCount} Unlocked`}
                            </span>
                        </div>
                        <div className="glass-panel rounded-xl p-6 border border-white/10 flex-1 relative overflow-hidden">
                            {/* Background accent */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-solana/5 blur-[50px] rounded-full"></div>

                            <div className="grid grid-cols-2 gap-4 place-items-center relative z-10">
                                {trophyItems.map((trophy) => (
                                    <div
                                        key={trophy.id}
                                        className={`flex flex-col items-center gap-2 group cursor-pointer transition-all duration-300 ${trophy.claimed ? "" : "opacity-30 grayscale"
                                            }`}
                                        title={`${trophy.title}: ${trophy.description}${trophy.claimed ? " ✓" : ""}`}
                                    >
                                        <div className="relative">
                                            <div className={`hexagon-container relative w-20 h-24 transition-transform group-hover:scale-110 duration-300 ${trophy.claimed
                                                ? "drop-shadow-[0_0_10px_rgba(20,241,149,0.25)]"
                                                : ""
                                                }`}>
                                                <div className="hexagon-inner absolute inset-0 bg-gradient-to-br from-gray-800 to-black p-[1px]">
                                                    <div className={`absolute inset-0 hexagon opacity-90 ${trophy.claimed
                                                        ? "bg-gradient-to-br from-solana to-emerald-900"
                                                        : "bg-gradient-to-br from-gray-700 to-gray-900"
                                                        }`}></div>
                                                    <div className="absolute inset-[2px] bg-void hexagon flex items-center justify-center">
                                                        <span className="text-3xl">{trophy.icon}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Claimed badge */}
                                            {trophy.claimed && (
                                                <div className="absolute -top-1 -right-1 size-5 bg-solana rounded-full flex items-center justify-center border-2 border-void shadow-[0_0_8px_rgba(20,241,149,0.6)]">
                                                    <span className="material-symbols-outlined text-[11px] text-void font-bold">check</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${trophy.claimed ? "text-solana" : "text-text-muted"
                                            }`}>
                                            {trophy.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
}
