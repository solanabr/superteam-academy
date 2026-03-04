"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Crown,
    Flame,
    Search,
    Zap,
    Trophy
} from "lucide-react";
import { leaderboardApi, LeaderboardUser } from "@/lib/leaderboard";

const tabs = [
    { id: "all", label: "All-Time" },
    { id: "month", label: "Season" },
    { id: "week", label: "Weekly" }
] as const;

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [rankings, setRankings] = useState<LeaderboardUser[]>([]);
    const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        leaderboardApi.getLeaderboard({ period: activeTab })
            .then(res => {
                setRankings(res.data.rankings);
                setCurrentUser(res.data.currentUser);
            })
            .catch(err => console.error("Failed to fetch leaderboard:", err))
            .finally(() => setLoading(false));
    }, [activeTab]);

    const filtered = rankings.filter((u) =>
        (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (u.username?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const getRankIcon = (rank: number) => {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return null;
    };

    const getRankTitle = (totalXP: number) => {
        if (totalXP >= 20000) return "Grandmaster";
        if (totalXP >= 15000) return "Champion";
        if (totalXP >= 10000) return "Veteran";
        if (totalXP >= 5000) return "Warrior";
        if (totalXP >= 2000) return "Fighter";
        if (totalXP >= 500) return "Initiate";
        return "Novice";
    };

    return (
        <div className="min-h-screen bg-[#050810] relative overflow-hidden flex flex-col font-sans">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.015] to-transparent" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/5 bg-white/[0.02]">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-neon-green transition-colors group font-mono">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        cd ../dashboard
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 border border-white/10 bg-white/5 flex items-center justify-center text-white">
                            <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white tracking-widest uppercase font-mono">Osmos</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-20 lg:py-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 space-y-4"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-amber-400 font-mono text-sm">{">"}</span>
                                <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                                    arena_leaderboard
                                </span>
                                <div className="hidden sm:block w-24 h-px bg-white/[0.06]" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                                Top <span className="text-amber-400">Builders</span>
                            </h1>
                            <p className="text-sm text-zinc-400 font-mono mt-4 leading-relaxed max-w-xl">
                                <span className="text-amber-400/60">// </span>
                                Rank up by earning XP. Prove your skills on-chain.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search usernames..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/40 focus:bg-white/[0.04] transition-all"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* RPG Style Leaderboard Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden"
                >
                    <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 font-mono">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold text-white uppercase tracking-wider">Global Rankings</span>
                        </div>
                        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                            {tabs.map((tab) => (
                                <button key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" : "text-zinc-500 hover:text-zinc-300 border border-transparent"}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-white/[0.03]">
                        {loading ? (
                            <div className="p-10 text-center font-mono text-zinc-500 text-sm">
                                <span className="animate-pulse">Loading rankings...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-10 text-center font-mono text-zinc-500 text-sm">
                                No builders found matching "{searchQuery}"
                            </div>
                        ) : (
                            filtered.map((player, i) => {
                                const rankIcon = getRankIcon(player.rank);
                                const title = getRankTitle(player.totalXP);
                                const isMe = currentUser?.username === player.username;

                                return (
                                    <motion.div
                                        key={player.userId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className={`flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors group relative ${player.rank === 1 ? "bg-amber-400/[0.03]" : ""} ${isMe ? "border-l-2 border-l-neon-green bg-neon-green/[0.02]" : "border-l-2 border-l-transparent"}`}
                                    >
                                        {player.rank === 1 && (
                                            <motion.div
                                                animate={{ opacity: [0, 0.08, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 pointer-events-none"
                                            />
                                        )}

                                        <div className="w-8 md:w-12 text-center relative z-10 font-mono">
                                            {rankIcon ? (
                                                <span className="text-xl md:text-2xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">{rankIcon}</span>
                                            ) : (
                                                <span className={`text-sm md:text-base font-bold ${isMe ? "text-neon-green" : "text-zinc-600"}`}>#{player.rank}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 relative z-10 pl-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-sm font-bold font-mono truncate transition-colors ${isMe ? "text-neon-green" : "text-white group-hover:text-amber-400"}`}>
                                                    {player.name || player.username}
                                                </span>
                                                {isMe && (
                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neon-green/10 text-neon-green border border-neon-green/20 uppercase tracking-wider hidden sm:inline-block">You</span>
                                                )}
                                                <span className={`text-[8px] font-black font-mono uppercase tracking-wider px-1.5 py-0.5 hidden sm:inline-block ${title === "Grandmaster" ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" :
                                                    title === "Champion" ? "bg-neon-purple/10 text-neon-purple border border-neon-purple/20" :
                                                        title === "Veteran" ? "bg-blue-400/10 text-blue-400 border border-blue-400/20" :
                                                            "bg-white/5 text-zinc-500 border border-white/[0.06]"
                                                    }`}>{title}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                                                <span className="hidden sm:inline-block">@{player.username}</span>
                                                <span className="hidden sm:inline-block text-zinc-700">•</span>
                                                <span className="flex items-center gap-0.5 font-bold">Lvl {player.level}</span>
                                                <span className="flex items-center gap-0.5 text-orange-400/80 font-bold"><Flame className="w-3 h-3" />{player.currentStreak}d</span>
                                            </div>
                                        </div>

                                        <div className="text-right relative z-10 font-mono flex items-center gap-4">
                                            <div className="min-w-[80px]">
                                                <div className="text-sm md:text-base font-black text-amber-400 flex items-center justify-end gap-1">
                                                    {player.totalXP.toLocaleString()} <Zap className="w-3 h-3 hidden sm:block" />
                                                </div>
                                                <div className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">Total XP</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer / User Sticky Status */}
                    {currentUser && !filtered.some(u => u.username === currentUser.username) && (
                        <div className="px-5 py-4 border-t border-white/5 bg-neon-green/[0.02] flex flex-col sm:flex-row sm:items-center justify-between relative overflow-hidden font-mono border-l-2 border-l-neon-green">
                            <motion.div
                                animate={{ x: [-300, 600] }}
                                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
                                className="absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-neon-green/5 to-transparent pointer-events-none"
                            />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-8 text-center text-sm font-bold text-zinc-500">
                                    #{currentUser.rank}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-neon-green mb-0.5">You</div>
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-bold">
                                        <span>Lvl {currentUser.level}</span>
                                        <span className="flex items-center gap-0.5 text-orange-400/80"><Flame className="w-3 h-3" />{currentUser.currentStreak}d</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right relative z-10 mt-2 sm:mt-0">
                                <div className="text-sm font-black text-amber-400 flex items-center justify-end gap-1">
                                    {currentUser.totalXP.toLocaleString()} <Zap className="w-3 h-3 hidden sm:block" />
                                </div>
                                <div className="text-[8px] text-neon-green uppercase tracking-widest mt-0.5 font-bold">Your Rank</div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
