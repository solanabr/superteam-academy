"use client";

import { Trophy, Crown, Medal } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/learning-progress/types";
import { Link } from "@/i18n/routing";
import clsx from "clsx";

interface LeaderboardPodiumProps {
    topThree: LeaderboardEntry[];
}

export function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
    if (topThree.length < 1) return null;

    // Reorder to [2, 1, 3] for visual podium layout
    const podiumOrder = [];
    if (topThree[1]) podiumOrder.push(topThree[1]); // Rank 2
    if (topThree[0]) podiumOrder.push(topThree[0]); // Rank 1
    if (topThree[2]) podiumOrder.push(topThree[2]); // Rank 3

    return (
        <div className="flex flex-col items-center justify-center mb-12 mt-12 px-4">
            <div className="flex items-end justify-center gap-2 sm:gap-6 w-full max-w-3xl h-[280px]">
                {podiumOrder.map((entry) => {
                    const isRank1 = entry.rank === 1;
                    const isRank2 = entry.rank === 2;
                    const isRank3 = entry.rank === 3;

                    return (
                        <div
                            key={entry.userId}
                            className={clsx(
                                "flex flex-col items-center transition-all duration-500 animate-in fade-in slide-in-from-bottom-8",
                                isRank1 ? "z-20 w-1/3" : "z-10 w-1/4 pb-4"
                            )}
                        >
                            {/* Avatar Section */}
                            <Link href={`/profile/${entry.walletAddress}`} className="relative mb-4 group block">
                                {isRank1 && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce">
                                        <Crown className="h-10 w-10 text-solana fill-solana/20 drop-shadow-[0_0_15px_rgba(20,241,149,0.5)]" />
                                    </div>
                                )}

                                <div className={clsx(
                                    "relative rounded-full overflow-hidden border-2 bg-[#0A0A0B] transition-transform duration-300 group-hover:scale-110",
                                    isRank1 ? "h-24 w-24 sm:h-32 sm:w-32 border-solana shadow-[0_0_35px_rgba(20,241,149,0.3)]" :
                                        isRank2 ? "h-20 w-20 sm:h-24 sm:w-24 border-solana/60 shadow-[0_0_25px_rgba(20,241,149,0.2)]" :
                                            "h-18 w-18 sm:h-22 sm:w-22 border-solana/30 shadow-[0_0_15px_rgba(20,241,149,0.1)]"
                                )}>
                                    <img
                                        src={`https://api.dicebear.com/9.x/bottts/svg?seed=${entry.walletAddress}&backgroundColor=0a0a0b&baseColor=14f195&radius=50&sidesProbability=0&topProbability=0`}
                                        alt="avatar"
                                        className="h-full w-full"
                                    />
                                </div>
                            </Link>

                            {/* User Identity */}
                            <div className="text-center mb-6">
                                <Link
                                    href={`/profile/${entry.walletAddress}`}
                                    className="block text-sm sm:text-base font-bold text-text-primary hover:text-solana transition-colors truncate w-full px-2"
                                >
                                    {entry.walletAddress.slice(0, 4)}...{entry.walletAddress.slice(-4)}
                                </Link>
                                <div className={clsx(
                                    "text-xs sm:text-sm font-mono font-bold mt-1",
                                    isRank1 ? "text-solana" : isRank2 ? "text-solana/80" : "text-solana/60"
                                )}>
                                    {entry.xp.toLocaleString()} XP
                                </div>
                            </div>

                            {/* Podium Box */}
                            <div
                                className={clsx(
                                    "w-full rounded-t-2xl border-x-2 border-t-2 flex flex-col items-center justify-center p-4 relative overflow-hidden backdrop-blur-md",
                                    isRank1 ? "h-32 bg-solana/10 border-solana/50 shadow-[inset_0_0_20px_rgba(20,241,149,0.1)]" :
                                        isRank2 ? "h-24 bg-solana/5 border-solana/30 shadow-[inset_0_0_15px_rgba(20,241,149,0.05)]" :
                                            "h-20 bg-solana/[0.02] border-solana/10"
                                )}
                            >
                                {/* Visual texture for the box */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/80 to-transparent opacity-50" />

                                <div className="relative z-10 flex flex-col items-center">
                                    {isRank1 ? (
                                        <Trophy className="h-8 w-8 text-solana mb-1 drop-shadow-[0_0_10px_rgba(20,241,149,0.5)]" />
                                    ) : isRank2 ? (
                                        <Medal className="h-7 w-7 text-solana/80 mb-1" />
                                    ) : (
                                        <Medal className="h-6 w-6 text-solana/60 mb-1" />
                                    )}
                                    <span className={clsx(
                                        "text-2xl sm:text-3xl font-display font-black",
                                        isRank1 ? "text-solana" : isRank2 ? "text-solana/80" : "text-solana/60"
                                    )}>
                                        #{entry.rank}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
