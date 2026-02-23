"use client";

import { useState } from "react";
import { Sparkles, Trophy, Crown, Medal } from "lucide-react";
import {
    getMockLeaderboard,
} from "@/lib/services/mock-leaderboard";
import type { LeaderboardTimeframe } from "@/lib/services/learning-progress";
import { cn } from "@/lib/utils";
import { useXpBalance } from "@/hooks";
import { useWallet } from "@solana/wallet-adapter-react";

const timeframes: { value: LeaderboardTimeframe; label: string }[] = [
    { value: "weekly", label: "Daily" },
    { value: "monthly", label: "Monthly" },
    { value: "all-time", label: "All Time" },
];

function truncateWallet(address: string) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function PodiumAvatar({ rank, wallet }: { rank: number; wallet: string }) {
    const seed = wallet.slice(0, 8);
    const hue = parseInt(seed, 36) % 360;
    return (
        <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/10 text-xl font-bold text-white shadow-lg"
            style={{
                background: `linear-gradient(135deg, hsl(${hue}, 60%, 40%), hsl(${(hue + 40) % 360}, 50%, 30%))`,
            }}
        >
            {wallet.slice(0, 2)}
        </div>
    );
}

export default function LeaderboardPage() {
    const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("all-time");
    const entries = getMockLeaderboard(timeframe);
    const { data: xp } = useXpBalance();
    const { publicKey } = useWallet();

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    // Reorder top 3 for podium: [2nd, 1st, 3rd]
    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

    return (
        <div className="min-h-screen bg-[#0f1419]">
            <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Title */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Top learners ranked by XP earned
                    </p>
                </div>

                {/* Timeframe toggle */}
                <div className="mx-auto mb-10 flex w-fit rounded-full bg-[#1a2332] p-1">
                    {timeframes.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setTimeframe(value)}
                            className={cn(
                                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                                timeframe === value
                                    ? "bg-[#2a3a4e] text-white shadow-md"
                                    : "text-gray-400 hover:text-gray-200"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Podium */}
                <div className="mb-8 flex items-end justify-center gap-3">
                    {podiumOrder.map((entry, i) => {
                        const isFirst = entry.rank === 1;
                        const isSecond = entry.rank === 2;
                        const isThird = entry.rank === 3;

                        const podiumHeight = isFirst ? "h-36" : isSecond ? "h-28" : "h-20";
                        const podiumBg = isFirst
                            ? "bg-gradient-to-t from-[#1e2d42] to-[#263d57]"
                            : "bg-gradient-to-t from-[#1a2332] to-[#223044]";

                        const badgeColor = isFirst
                            ? "bg-yellow-500 text-black"
                            : isSecond
                                ? "bg-gray-400 text-black"
                                : "bg-amber-700 text-white";

                        const xpReward = isFirst ? "10,000" : isSecond ? "5,000" : "2,500";

                        return (
                            <div
                                key={entry.rank}
                                className={cn(
                                    "flex flex-col items-center",
                                    isFirst ? "order-2 -mx-1" : isSecond ? "order-1" : "order-3"
                                )}
                            >
                                {/* Avatar */}
                                <PodiumAvatar rank={entry.rank} wallet={entry.wallet} />

                                {/* Name */}
                                <p className="mt-2 text-sm font-semibold text-white">
                                    {truncateWallet(entry.wallet)}
                                </p>

                                {/* Trophy badge */}
                                <div
                                    className={cn(
                                        "mt-2 flex h-8 w-8 items-center justify-center rounded-lg",
                                        badgeColor
                                    )}
                                >
                                    {isFirst ? (
                                        <Crown className="h-4 w-4" />
                                    ) : (
                                        <Trophy className="h-4 w-4" />
                                    )}
                                </div>

                                {/* Points label */}
                                <p className="mt-1 text-xs text-gray-400">
                                    Earn {entry.xp.toLocaleString()} points
                                </p>

                                {/* Podium block */}
                                <div
                                    className={cn(
                                        "mt-3 flex w-40 flex-col items-center justify-center rounded-t-xl",
                                        podiumHeight,
                                        podiumBg
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 text-lg font-bold text-white">
                                        <Sparkles className="h-4 w-4 text-blue-400" />
                                        {xpReward}
                                    </div>
                                    <p className="text-xs text-gray-400">Prize</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Countdown / info banner */}
                <div className="mb-6 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Trophy className="h-3.5 w-3.5" />
                        <span>Ends in 00d 00h 43m 51s</span>
                    </div>

                    {publicKey && (
                        <div className="rounded-full bg-[#1a2332] px-5 py-2 text-sm text-gray-300">
                            You earned{" "}
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-400">
                                <Sparkles className="h-3.5 w-3.5" />
                                {(xp ?? 0).toLocaleString()}
                            </span>{" "}
                            today and are ranked – out of{" "}
                            <span className="font-bold text-white">13,868 users</span>
                        </div>
                    )}
                </div>

                {/* Ranked table */}
                <div className="overflow-hidden rounded-xl border border-white/5 bg-[#141c27]">
                    {/* Table header */}
                    <div className="grid grid-cols-[60px_1fr_1fr_100px] items-center border-b border-white/5 px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                        <span>Place</span>
                        <span>Username</span>
                        <span className="text-center">Points</span>
                        <span className="text-right">Prize</span>
                    </div>

                    {/* Table rows */}
                    {rest.map((entry) => (
                        <div
                            key={entry.rank}
                            className="grid grid-cols-[60px_1fr_1fr_100px] items-center border-b border-white/5 px-5 py-3 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Trophy className="h-3.5 w-3.5 text-gray-600" />
                                <span className="text-sm font-medium text-gray-300">
                                    {entry.rank}
                                </span>
                            </div>
                            <span className="font-mono text-sm text-gray-300">
                                {truncateWallet(entry.wallet)}
                            </span>
                            <span className="text-center text-sm font-semibold text-white">
                                {entry.xp.toLocaleString()}
                            </span>
                            <div className="flex items-center justify-end gap-1">
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                                    <Sparkles className="h-3 w-3" />
                                    {Math.round(entry.xp * 0.1).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
