"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useState } from "react";
import { Zap, Trophy, Flame } from "lucide-react";
import { formatXP, calculateLevel, getLevelTitle } from "@/lib/xp";

// Demo leaderboard data (in production: from /api/leaderboard fetching Token-2022 ATAs via Helius)
const MOCK_LEADERS = Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    wallet: `${["Phantom", "Backpack", "Solflare"][i % 3]}${Math.floor(Math.random() * 9000 + 1000)}`,
    address: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
    xp: Math.floor(Math.random() * 15000) + (20 - i) * 500,
    streak: Math.floor(Math.random() * 30),
    country: ["🇧🇷", "🇺🇸", "🇦🇷", "🇲🇽", "🇵🇹"][i % 5],
})).sort((a, b) => b.xp - a.xp).map((l, i) => ({ ...l, rank: i + 1 }));

export default function LeaderboardPage() {
    const [tab, setTab] = useState<"global" | "weekly">("global");

    const top3 = MOCK_LEADERS.slice(0, 3);
    const rest = MOCK_LEADERS.slice(3);

    return (
        <div className="min-h-screen">
            <Header />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="font-heading text-4xl font-bold mb-2">Leaderboard</h1>
                    <p className="text-[hsl(var(--muted-foreground))]">Rankings based on onchain XP (Token-2022)</p>
                </div>

                {/* Tab switcher */}
                <div className="flex justify-center mb-10">
                    <div className="glass rounded-xl p-1 flex gap-1">
                        {(["global", "weekly"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t
                                        ? "bg-[hsl(var(--primary))] text-white shadow-md"
                                        : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                    }`}
                            >
                                {t === "global" ? "🌎 Global" : "📅 Weekly"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top 3 podium */}
                <div className="flex items-end justify-center gap-4 mb-10">
                    {/* 2nd */}
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-2xl mb-2 shadow-lg">
                            {top3[1].country}
                        </div>
                        <p className="font-semibold text-sm">{top3[1].wallet}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatXP(top3[1].xp)} XP</p>
                        <div className="w-20 h-16 bg-gray-500/20 rounded-t-xl flex items-center justify-center mt-2">
                            <span className="text-2xl font-bold text-gray-400">2</span>
                        </div>
                    </div>

                    {/* 1st */}
                    <div className="flex flex-col items-center -mt-6">
                        <Trophy className="w-6 h-6 text-yellow-400 mb-1" />
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl mb-2 shadow-xl ring-2 ring-yellow-400/50">
                            {top3[0].country}
                        </div>
                        <p className="font-bold text-sm">{top3[0].wallet}</p>
                        <p className="text-xs text-yellow-400 font-semibold">{formatXP(top3[0].xp)} XP</p>
                        <div className="w-20 h-24 bg-yellow-500/20 rounded-t-xl flex items-center justify-center mt-2">
                            <span className="text-3xl font-bold text-yellow-400">1</span>
                        </div>
                    </div>

                    {/* 3rd */}
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center text-2xl mb-2 shadow-lg">
                            {top3[2].country}
                        </div>
                        <p className="font-semibold text-sm">{top3[2].wallet}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatXP(top3[2].xp)} XP</p>
                        <div className="w-20 h-10 bg-orange-800/20 rounded-t-xl flex items-center justify-center mt-2">
                            <span className="text-2xl font-bold text-orange-600">3</span>
                        </div>
                    </div>
                </div>

                {/* Full table */}
                <div className="glass rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[hsl(var(--border))]">
                                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">#</th>
                                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Wallet</th>
                                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden sm:table-cell">Level</th>
                                <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">XP</th>
                                <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden sm:table-cell">Streak</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rest.map((leader) => {
                                const level = calculateLevel(leader.xp);
                                return (
                                    <tr key={leader.rank} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                        <td className="px-4 sm:px-6 py-4 font-mono text-sm text-[hsl(var(--muted-foreground))]">
                                            {leader.rank}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{leader.country}</span>
                                                <div>
                                                    <p className="font-semibold text-sm">{leader.wallet}</p>
                                                    <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">{leader.address}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-semibold">
                                                Lv.{level} {getLevelTitle(level)}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right">
                                            <span className="flex items-center justify-end gap-1 font-semibold text-sm text-green-400">
                                                <Zap className="w-3.5 h-3.5" />{formatXP(leader.xp)}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right hidden sm:table-cell">
                                            <span className="flex items-center justify-end gap-1 text-sm text-orange-400">
                                                <Flame className="w-3.5 h-3.5" />{leader.streak}d
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Footer />
        </div>
    );
}
