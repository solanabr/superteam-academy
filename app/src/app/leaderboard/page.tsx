"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Trophy, Medal, Star, Flame, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

const LEADERBOARD_DATA = [
    { rank: 1, user: "danielfaria.sol", level: 12, xp: 14500, avatar: "D" },
    { rank: 2, user: "pedro.sol", level: 11, xp: 12200, avatar: "P" },
    { rank: 3, user: "ana_builds", level: 11, xp: 11950, avatar: "A" },
    { rank: 4, user: "carlos_dev", level: 10, xp: 9800, avatar: "C" },
    { rank: 5, user: "lucas.sol", level: 9, xp: 8400, avatar: "L" },
    { rank: 6, user: "julia_web3", level: 8, xp: 7200, avatar: "J" },
    { rank: 7, user: "marcos_nft", level: 7, xp: 6100, avatar: "M" },
    { rank: 8, user: "bia.sol", level: 7, xp: 5800, avatar: "B" },
    { rank: 9, user: "thiago_dev", level: 6, xp: 4900, avatar: "T" },
    { rank: 10, user: "fernanda.sol", level: 5, xp: 3200, avatar: "F" },
];

export default function LeaderboardPage() {
    const { connected } = useWallet();
    const [timeframe, setTimeframe] = useState<"weekly" | "all-time">("weekly");
    const t = useTranslations("leaderboard");

    return (
        <div className="min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="font-heading text-4xl font-bold mb-2 flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-500" /> {t("title")}
                        </h1>
                        <p className="text-[hsl(var(--muted-foreground))]">
                            {t("subtitle")}
                        </p>
                    </div>

                    {/* Timeframe Toggle */}
                    <div className="flex bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-1 shrink-0">
                        <button
                            onClick={() => setTimeframe("weekly")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${timeframe === "weekly"
                                ? "bg-[hsl(var(--primary))] text-white shadow-sm"
                                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                }`}
                        >
                            {t("weekly")}
                        </button>
                        <button
                            onClick={() => setTimeframe("all-time")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${timeframe === "all-time"
                                ? "bg-[hsl(var(--primary))] text-white shadow-sm"
                                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                }`}
                        >
                            {t("all_time")}
                        </button>
                    </div>
                </div>

                {/* Top 3 Podium */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-12 items-end pt-10">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 p-1">
                                <div className="w-full h-full rounded-full bg-[hsl(var(--background))] flex items-center justify-center text-xl font-bold">
                                    {LEADERBOARD_DATA[1].avatar}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-400 border-4 border-[hsl(var(--background))] flex items-center justify-center text-white font-bold text-xs shadow-lg">
                                2
                            </div>
                        </div>
                        <p className="font-semibold text-sm sm:text-base truncate w-full text-center">
                            {LEADERBOARD_DATA[1].user}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{LEADERBOARD_DATA[1].xp.toLocaleString()} XP</p>
                        <div className="w-full h-24 sm:h-32 bg-slate-500/20 rounded-t-xl border-t-2 border-slate-500/50 flex justify-center pt-4">
                            <Medal className="w-6 h-6 text-slate-400" />
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                            <Crown className="w-8 h-8 text-yellow-500 absolute -top-10 left-1/2 -translate-x-1/2" />
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 p-1">
                                <div className="w-full h-full rounded-full bg-[hsl(var(--background))] flex items-center justify-center text-2xl font-bold">
                                    {LEADERBOARD_DATA[0].avatar}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 border-4 border-[hsl(var(--background))] flex items-center justify-center text-white font-bold text-xs shadow-lg">
                                1
                            </div>
                        </div>
                        <p className="font-bold text-sm sm:text-lg truncate w-full text-center text-yellow-500">
                            {LEADERBOARD_DATA[0].user}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{LEADERBOARD_DATA[0].xp.toLocaleString()} XP</p>
                        <div className="w-full h-32 sm:h-40 bg-yellow-500/20 rounded-t-xl border-t-2 border-yellow-500/50 flex justify-center pt-4">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 p-1">
                                <div className="w-full h-full rounded-full bg-[hsl(var(--background))] flex items-center justify-center text-xl font-bold">
                                    {LEADERBOARD_DATA[2].avatar}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-orange-500 border-4 border-[hsl(var(--background))] flex items-center justify-center text-white font-bold text-xs shadow-lg">
                                3
                            </div>
                        </div>
                        <p className="font-semibold text-sm sm:text-base truncate w-full text-center">
                            {LEADERBOARD_DATA[2].user}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{LEADERBOARD_DATA[2].xp.toLocaleString()} XP</p>
                        <div className="w-full h-20 sm:h-24 bg-orange-500/20 rounded-t-xl border-t-2 border-orange-500/50 flex justify-center pt-4">
                            <Medal className="w-6 h-6 text-orange-400" />
                        </div>
                    </div>
                </div>

                {/* Rest of Leaderboard */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[hsl(var(--border))] text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                    <th className="p-4 font-semibold w-16 text-center">{t("rank")}</th>
                                    <th className="p-4 font-semibold">{t("builder")}</th>
                                    <th className="p-4 font-semibold text-center">{t("level")}</th>
                                    <th className="p-4 font-semibold text-right">{t("xp")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[hsl(var(--border))]">
                                {LEADERBOARD_DATA.slice(3).map((user) => (
                                    <tr key={user.rank} className="hover:bg-[hsl(var(--muted)/0.5)] transition-colors group">
                                        <td className="p-4 text-center font-mono text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                                            #{user.rank}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] flex items-center justify-center font-bold text-xs">
                                                    {user.avatar}
                                                </div>
                                                <Link href={`/profile/${user.user}`} className="font-medium hover:text-[hsl(var(--primary))] transition-colors">
                                                    {user.user}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1 text-[hsl(var(--muted-foreground))]">
                                                <Star className="w-3.5 h-3.5" /> {user.level}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono font-semibold text-green-400">
                                            {user.xp.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sticky current user ranking bar (if connected) */}
                {connected && (
                    <div className="sticky bottom-6 mt-8 glass bg-[hsl(var(--card))] border border-[hsl(var(--primary)/0.3)] shadow-[0_0_20px_rgba(168,85,247,0.15)] rounded-xl p-4 flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white font-bold shadow-lg">
                                Y
                            </div>
                            <div>
                                <p className="text-xs text-[hsl(var(--primary))] font-bold uppercase tracking-wide">{t("your_rank")}</p>
                                <p className="font-semibold">{t("you")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                            <div className="hidden sm:block">
                                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">{t("level")}</p>
                                <p className="font-semibold flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400" /> 4</p>
                            </div>
                            <div>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">{t("xp")}</p>
                                <p className="font-semibold text-green-400">2,450</p>
                            </div>
                            <div className="pl-6 border-l border-[hsl(var(--border))]">
                                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase">{t("rank")}</p>
                                <p className="font-heading font-bold text-xl">#142</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}