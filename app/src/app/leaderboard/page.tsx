"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Trophy, Zap, Flame, Medal, Crown, Award } from "lucide-react";
import { cn, formatXP, calculateLevel } from "@/lib/utils";
import { LeaderboardService } from "@/services";

const timeframes = ["weekly", "monthly", "allTime"] as const;

export default function LeaderboardPage() {
    const t = useTranslations("leaderboard");
    const { publicKey } = useWallet();
    const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "allTime">("allTime");

    const entries = LeaderboardService.getLeaderboard(timeframe);
    const userAddress = publicKey?.toBase58() || "";

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
        return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
    };

    const getRankBg = (rank: number) => {
        if (rank === 1) return "bg-amber-500/5 border-amber-500/20";
        if (rank === 2) return "bg-gray-400/5 border-gray-400/20";
        if (rank === 3) return "bg-amber-700/5 border-amber-700/20";
        return "";
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
                        <Trophy className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("subtitle")}</p>
                </div>

                {/* Timeframe Filter */}
                <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-card border border-border mb-8 max-w-md mx-auto">
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={cn(
                                "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                timeframe === tf
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            {t(tf)}
                        </button>
                    ))}
                </div>

                {/* Top 3 Podium */}
                <div className="flex items-end justify-center gap-4 mb-8">
                    {[entries[1], entries[0], entries[2]].map((entry, i) => {
                        if (!entry) return null;
                        const heights = ["h-28", "h-36", "h-24"];
                        const orders = ["order-1", "order-0 -mx-2 z-10", "order-2"];
                        return (
                            <motion.div
                                key={entry.rank}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn("w-28 sm:w-36 text-center", orders[i])}
                            >
                                <div className="mb-2">
                                    <div
                                        className={cn(
                                            "w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto flex items-center justify-center font-bold text-lg text-white",
                                            entry.rank === 1
                                                ? "bg-gradient-to-br from-amber-400 to-yellow-600 ring-4 ring-amber-400/30"
                                                : entry.rank === 2
                                                    ? "bg-gradient-to-br from-gray-300 to-gray-500 ring-4 ring-gray-400/20"
                                                    : "bg-gradient-to-br from-amber-600 to-amber-800 ring-4 ring-amber-700/20"
                                        )}
                                    >
                                        {entry.displayName.charAt(0)}
                                    </div>
                                    <div className="mt-2 text-sm font-semibold truncate">{entry.displayName}</div>
                                    <div className="text-xs text-muted-foreground">{formatXP(entry.xp)} XP</div>
                                </div>
                                <div
                                    className={cn(
                                        "rounded-t-xl flex items-start justify-center pt-3",
                                        heights[i],
                                        entry.rank === 1
                                            ? "bg-gradient-to-b from-amber-500/20 to-amber-500/5"
                                            : entry.rank === 2
                                                ? "bg-gradient-to-b from-gray-400/20 to-gray-400/5"
                                                : "bg-gradient-to-b from-amber-700/20 to-amber-700/5"
                                    )}
                                >
                                    <span className="text-2xl font-bold">{entry.rank}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Full Leaderboard */}
                <div className="glass rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                        <div className="col-span-1">{t("rank")}</div>
                        <div className="col-span-5">{t("builder")}</div>
                        <div className="col-span-2 text-right">{t("xp")}</div>
                        <div className="col-span-2 text-right">{t("level")}</div>
                        <div className="col-span-2 text-right">{t("streak")}</div>
                    </div>

                    {/* Entries */}
                    {entries.map((entry, i) => (
                        <motion.div
                            key={entry.rank}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={cn(
                                "grid grid-cols-12 gap-2 px-6 py-3 items-center border-b border-border last:border-0 hover:bg-secondary/20 transition-colors",
                                getRankBg(entry.rank),
                                entry.walletAddress === userAddress && "bg-primary/5 border-primary/20"
                            )}
                        >
                            <div className="col-span-1 flex items-center">{getRankIcon(entry.rank)}</div>
                            <div className="col-span-5 flex items-center gap-3">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0",
                                        "bg-gradient-to-br from-purple-600 to-emerald-500"
                                    )}
                                >
                                    {entry.displayName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {entry.displayName}
                                        {entry.walletAddress === userAddress && (
                                            <span className="ml-1 text-xs text-primary">({t("you")})</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono">{entry.walletAddress}</div>
                                </div>
                            </div>
                            <div className="col-span-2 text-right">
                                <span className="text-sm font-bold">{formatXP(entry.xp)}</span>
                                <Zap className="w-3 h-3 inline ml-0.5 text-emerald-400" />
                            </div>
                            <div className="col-span-2 text-right text-sm font-medium">
                                Lvl {entry.level}
                            </div>
                            <div className="col-span-2 text-right flex items-center justify-end gap-1">
                                <Flame className="w-3.5 h-3.5 text-orange-400" />
                                <span className="text-sm font-medium">{entry.streak}d</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
