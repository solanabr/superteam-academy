"use client";

import { useEffect, useState } from "react";
import { useAppUser } from "@/hooks/useAppUser";
import { useUserStore } from "@/store/user-store";
import { useAchievementStore } from "@/store/achievement-store";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getRankFromXp, getRankProgress, getLevelFromXp } from "@/lib/ranks";
import { Link } from "@/i18n/routing";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { CredentialList } from "@/components/dashboard/CredentialList";
import { Button } from "@/components/ui/button";
import { withFallbackRPC } from "@/lib/solana-connection";

export default function DashboardPage() {
    const t = useTranslations("dashboard");
    const { user } = useAppUser();

    // Read from Zustand stores directly
    const progress = useUserStore((s) => s.progress);
    const isProgressLoading = useUserStore((s) => s.isProgressLoading);
    const fetchProgress = useUserStore((s) => s.fetchProgress);

    const achievements = useAchievementStore((s) => s.achievements);
    const isAchievementsLoading = useAchievementStore((s) => s.isLoading);
    const fetchAchievements = useAchievementStore((s) => s.fetchAchievements);

    const [solBalance, setSolBalance] = useState<number | null>(null);

    // Fetch progress and achievements when wallet is available
    useEffect(() => {
        if (user?.walletAddress) {
            fetchProgress(user.walletAddress);
            fetchAchievements(user.walletAddress);

            const fetchBalance = async () => {
                try {
                    const { PublicKey } = await import("@solana/web3.js");
                    await withFallbackRPC(async (conn) => {
                        const b = await conn.getBalance(new PublicKey(user.walletAddress));
                        setSolBalance(b / 1e9);
                    });
                } catch (e) {
                    console.error("Failed to fetch balance", e);
                }
            };
            fetchBalance();
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

                    <div className="flex items-center gap-4 mt-2 mb-1">
                        <div className="size-16 rounded-full border border-white/10 shadow-[0_0_15px_rgba(20,241,149,0.1)] overflow-hidden bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center">
                            {(user?.profile as any)?.image ? (
                                <Image
                                    src={(user?.profile as any).image}
                                    alt="Avatar"
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                    unoptimized={((user?.profile as any).image as string).includes('dicebear')}
                                />
                            ) : user?.walletAddress ? (
                                <Image
                                    src={`https://api.dicebear.com/9.x/bottts/svg?seed=${user.walletAddress}&backgroundColor=0a0a0b&baseColor=14f195&radius=50&sidesProbability=0&topProbability=0`}
                                    alt="Avatar"
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <span className="font-mono text-xl text-white">
                                    {(user?.profile as any)?.displayName?.slice(0, 2).toUpperCase() || "DV"}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
                                {t("welcome", { name: (user?.profile as any)?.displayName || (user?.walletAddress ? "Dev" : "Student") })}
                            </h2>
                            <p className="font-mono text-text-muted text-sm flex items-center gap-2 mt-1">
                                <span className="material-symbols-outlined notranslate text-sm">wallet</span>
                                {t("wallet_id")}: <span className="text-solana/80">{user?.walletAddress ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}` : "Not Connected"}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="default" className="flex items-center gap-2 px-4 py-2 bg-solana/10 hover:bg-solana/20 border border-solana/20 text-solana rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(20,241,149,0.1)] hover:shadow-[0_0_20px_rgba(20,241,149,0.2)] h-auto">
                        <Link href="/courses">
                            <span className="material-symbols-outlined notranslate text-lg">code</span>
                            {t("browse_courses")}
                        </Link>
                    </Button>
                </div>
            </header>

            {/* Warning Section */}
            {solBalance !== null && solBalance < 0.5 && (
                <div className="bg-rust/10 border border-rust/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-[0_0_15px_rgba(255,100,100,0.1)]">
                    <div className="flex-shrink-0 size-10 rounded-full bg-rust/20 flex items-center justify-center border border-rust/30">
                        <span className="material-symbols-outlined text-rust">warning</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-white mb-1">Low Devnet SOL Balance</h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            You have {solBalance.toFixed(2)} SOL. You need Devnet SOL to pay for gas fees when enrolling in courses and completing lessons.
                        </p>
                    </div>
                    <Button
                        asChild
                        variant="destructive"
                        className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-rust hover:bg-rust/90 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(255,100,100,0.2)] h-auto"
                    >
                        <a
                            href="https://faucet.solana.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Get Devnet SOL
                            <span className="material-symbols-outlined text-base">open_in_new</span>
                        </a>
                    </Button>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* XP Card */}
                <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined notranslate text-4xl text-white">data_usage</span>
                    </div>
                    <p className="text-text-muted text-[10px] font-mono uppercase tracking-[0.2em] font-bold">{t("stats.xp")}</p>
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
                    <p className="text-text-muted text-sm font-display uppercase tracking-widest font-semibold">{t("stats.streak")}</p>
                    <h3 className="text-4xl font-mono font-bold text-white">
                        {isLoading ? "..." : currentStreak} <span className="text-lg text-text-muted font-normal">{t("stats.days")}</span>
                    </h3>
                    <p className="text-xs text-text-muted">
                        {currentStreak >= 7
                            ? t("stats.streak_amazing", { days: longestStreak })
                            : t("stats.streak_bonus", { days: 7 - currentStreak })}
                    </p>
                </div>

                {/* Rank Card */}
                <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <span className="material-symbols-outlined notranslate text-4xl text-white">military_tech</span>
                    </div>
                    <p className="text-text-muted text-sm font-display uppercase tracking-widest font-semibold">{t("stats.rank")}</p>
                    <h3 className={`text-4xl font-display font-bold ${rankInfo.color}`}>
                        {isLoading ? "..." : rankInfo.name}
                    </h3>
                    <p className="text-xs text-text-muted">
                        {rankInfo.nextRank
                            ? t("stats.next_rank", { rank: rankInfo.nextRank, xp: rankInfo.nextXp ? rankInfo.nextXp.toLocaleString() : "0" })
                            : t("stats.max_rank")}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* Trophy Case - Dynamic */}
                <section className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-display font-semibold text-white">{t("trophy_case")}</h3>
                        <span className="text-xs font-mono text-text-muted">
                            {isAchievementsLoading ? "..." : t("unlocked", { count: unlockedCount, total: totalCount })}
                        </span>
                    </div>
                    <div className="glass-panel rounded-xl p-6 border border-white/10 flex-1 relative overflow-hidden">
                        {/* Background accent */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-solana/5 blur-[80px] rounded-full"></div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 place-items-center relative z-10 w-full">
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
                                        } text-center`}>
                                        {trophy.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
            {/* Credentials Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-semibold text-white">Certificates & Credentials</h3>
                </div>
                <CredentialList />
            </section>

            <Footer />
        </div>
    );
}
