"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import { Flame, Trophy, Zap, Target, Crown, Medal, Star, Swords, Shield, Award, Lock, ChevronRight, Sparkles, Gift, Gem, Scroll } from "lucide-react";

/* ─── Mini Leaderboard Preview ─── */
function LeaderboardPreview() {
    const players = [
        { rank: 1, name: "rafael.sol", xp: 24850, level: 15, streak: 45, avatar: "🥇", change: "+2", title: "Grandmaster" },
        { rank: 2, name: "maria.eth", xp: 22100, level: 14, streak: 32, avatar: "🥈", change: "+1", title: "Champion" },
        { rank: 3, name: "lucas.sol", xp: 19800, level: 14, streak: 28, avatar: "🥉", change: "-1", title: "Champion" },
        { rank: 4, name: "ana.dev", xp: 17500, level: 13, streak: 21, avatar: "4", change: "+3", title: "Veteran" },
        { rank: 5, name: "pedro.sol", xp: 15200, level: 12, streak: 15, avatar: "5", change: "0", title: "Warrior" },
    ];

    const rankColors: Record<number, string> = {
        1: "from-amber-400 to-yellow-200",
        2: "from-zinc-300 to-zinc-400",
        3: "from-amber-600 to-amber-700",
    };

    return (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Crown className="w-4 h-4 text-amber-400" />
                    </motion.div>
                    <span className="text-sm font-black text-white">⚔️ Arena Leaderboard</span>
                </div>
                <div className="flex gap-1">
                    {["Weekly", "Season", "All-Time"].map((filter, i) => (
                        <button key={filter}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${i === 0 ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "text-zinc-600 hover:text-zinc-400"}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="divide-y divide-white/[0.03]">
                {players.map((player, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className={`flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group relative ${i === 0 ? "bg-amber-400/[0.03]" : ""}`}
                    >
                        {i === 0 && (
                            <motion.div
                                animate={{ opacity: [0, 0.08, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0"
                            />
                        )}
                        <div className="w-8 text-center relative z-10">
                            {player.rank <= 3 ? (
                                <span className={`text-lg font-black bg-clip-text text-transparent bg-gradient-to-b ${rankColors[player.rank]}`}>
                                    {player.avatar}
                                </span>
                            ) : (
                                <span className="text-sm font-bold text-zinc-600">#{player.rank}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white truncate group-hover:text-neon-green transition-colors">
                                    {player.name}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${player.title === "Grandmaster" ? "bg-amber-400/10 text-amber-400" :
                                    player.title === "Champion" ? "bg-neon-purple/10 text-neon-purple" :
                                        "bg-white/5 text-zinc-500"
                                    }`}>{player.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                                <span className="flex items-center gap-0.5">Lvl {player.level}</span>
                                <span className="flex items-center gap-0.5 text-orange-400/60"><Flame className="w-2.5 h-2.5" />{player.streak}d</span>
                            </div>
                        </div>
                        <div className="text-right relative z-10">
                            <div className="text-sm font-black text-neon-green">{player.xp.toLocaleString()}</div>
                            <div className={`text-[10px] font-bold ${player.change.startsWith("+") ? "text-emerald-400" : player.change === "0" ? "text-zinc-600" : "text-red-400"}`}>
                                {player.change !== "0" ? `${player.change} ↕` : "—"}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between relative overflow-hidden">
                <motion.div
                    animate={{ x: [-300, 600] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                    className="absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-neon-green/5 to-transparent"
                />
                <div className="flex items-center gap-2 text-[10px] relative z-10">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center text-[8px] font-black text-black">U</div>
                    <span className="text-zinc-500">Your rank: </span>
                    <span className="text-white font-black">#42</span>
                    <span className="text-zinc-600">• 7,340 XP</span>
                    <span className="text-neon-green font-bold">⬆ +5 this week</span>
                </div>
                <Link href="/auth">
                    <button className="text-[10px] text-neon-cyan font-bold hover:text-neon-cyan/80 flex items-center gap-0.5 relative z-10">
                        View Full Board <ChevronRight className="w-3 h-3" />
                    </button>
                </Link>
            </div>
        </div>
    );
}

/* ─── Achievement Grid ─── */
function AchievementGrid() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const achievements = [
        { icon: Star, name: "First Steps", desc: "Complete your first lesson", earned: true, rarity: "Common", color: "from-emerald-400 to-neon-green", xp: 50 },
        { icon: Flame, name: "Week Warrior", desc: "7-day streak", earned: true, rarity: "Uncommon", color: "from-orange-400 to-amber-400", xp: 100 },
        { icon: Swords, name: "Challenge Master", desc: "Pass 10 challenges", earned: true, rarity: "Rare", color: "from-neon-cyan to-blue-400", xp: 200 },
        { icon: Shield, name: "Anchor Expert", desc: "Complete Anchor track", earned: false, rarity: "Epic", color: "from-neon-purple to-violet-400", xp: 500 },
        { icon: Crown, name: "Speed Runner", desc: "Finish course in 1 week", earned: false, rarity: "Legendary", color: "from-amber-400 to-yellow-300", xp: 1000 },
        { icon: Award, name: "Bug Hunter", desc: "Report 3 valid bugs", earned: false, rarity: "Legendary", color: "from-red-400 to-pink-400", xp: 750 },
    ];

    const rarityColors: Record<string, string> = {
        Common: "text-zinc-400",
        Uncommon: "text-emerald-400",
        Rare: "text-blue-400",
        Epic: "text-neon-purple",
        Legendary: "text-amber-400",
    };

    const rarityGlows: Record<string, string> = {
        Common: "",
        Uncommon: "shadow-[0_0_15px_rgba(52,211,153,0.2)]",
        Rare: "shadow-[0_0_15px_rgba(96,165,250,0.2)]",
        Epic: "shadow-[0_0_20px_rgba(153,69,255,0.3)]",
        Legendary: "shadow-[0_0_25px_rgba(251,191,36,0.3)]",
    };

    return (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-black text-white">🏆 Achievements</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold">3/6 Unlocked</span>
            </div>

            <div className="grid grid-cols-3 gap-px bg-white/[0.03]">
                {achievements.map((a, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`p-4 text-center space-y-2 bg-[#0a0f1a] hover:bg-white/[0.02] transition-all duration-300 relative group cursor-pointer ${!a.earned ? "opacity-40 grayscale hover:opacity-60 hover:grayscale-0" : ""}`}
                    >
                        {!a.earned && (
                            <div className="absolute top-2 right-2">
                                <Lock className="w-3 h-3 text-zinc-600" />
                            </div>
                        )}
                        <motion.div
                            animate={hoveredIndex === i && a.earned ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.5 }}
                            className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${a.color} p-[1.5px] ${a.earned ? rarityGlows[a.rarity] : ""}`}
                        >
                            <div className="w-full h-full rounded-xl bg-[#0a0f1a] flex items-center justify-center group-hover:bg-[#0d1220] transition-colors">
                                <a.icon className="w-6 h-6 text-white" />
                            </div>
                        </motion.div>
                        <div>
                            <div className="text-xs font-bold text-white">{a.name}</div>
                            <div className={`text-[9px] font-black ${rarityColors[a.rarity]} uppercase tracking-wider`}>{a.rarity}</div>
                            <div className="text-[10px] text-zinc-600 mt-0.5 font-bold">+{a.xp} XP</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ─── Battle Pass / Season Rewards ─── */
function BattlePass() {
    const tiers = [
        { level: 1, reward: "🎨 Profile Border", type: "Cosmetic", unlocked: true, xpNeeded: 0 },
        { level: 5, reward: "🗡️ Streak Freeze x3", type: "Power-up", unlocked: true, xpNeeded: 500 },
        { level: 10, reward: "🛡️ Uncommon Badge", type: "NFT", unlocked: true, xpNeeded: 1000 },
        { level: 15, reward: "✨ Animated Avatar", type: "Cosmetic", unlocked: false, xpNeeded: 2500, current: true },
        { level: 25, reward: "⚔️ Rare Title: Blade", type: "Title", unlocked: false, xpNeeded: 5000 },
        { level: 35, reward: "💎 Epic Achievement", type: "NFT", unlocked: false, xpNeeded: 8000 },
        { level: 50, reward: "👑 Legendary Skin", type: "Cosmetic", unlocked: false, xpNeeded: 15000 },
        { level: 100, reward: "🏆 Season Champion NFT", type: "NFT", unlocked: false, xpNeeded: 50000 },
    ];

    return (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <Sparkles className="w-4 h-4 text-neon-purple" />
                    </motion.div>
                    <span className="text-sm font-black text-white">⚔️ Season 1 Battle Pass</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold">Tier 12/100</span>
                    <span className="text-[10px] text-neon-green font-bold">FREE</span>
                </div>
            </div>

            {/* Progress timeline */}
            <div className="p-5 overflow-x-auto">
                <div className="flex items-center gap-0 min-w-[600px]">
                    {tiers.map((tier, i) => (
                        <div key={i} className="flex items-center">
                            {/* Tier node */}
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, type: "spring", bounce: 0.4 }}
                                className="flex flex-col items-center relative"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg relative ${tier.unlocked
                                    ? "bg-gradient-to-br from-neon-green to-emerald-400 shadow-[0_0_20px_rgba(0,255,163,0.3)]"
                                    : tier.current
                                        ? "bg-gradient-to-br from-neon-purple to-violet-400 shadow-[0_0_20px_rgba(153,69,255,0.3)] ring-2 ring-neon-purple/50"
                                        : "bg-white/5 border border-white/10"
                                    }`}>
                                    {tier.unlocked ? (
                                        <span>{tier.reward.split(" ")[0]}</span>
                                    ) : tier.current ? (
                                        <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                            {tier.reward.split(" ")[0]}
                                        </motion.span>
                                    ) : (
                                        <Lock className="w-4 h-4 text-zinc-600" />
                                    )}
                                    {tier.current && (
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="absolute inset-0 rounded-xl border-2 border-neon-purple"
                                        />
                                    )}
                                </div>
                                <div className="mt-2 text-center w-20">
                                    <div className={`text-[9px] font-black uppercase tracking-wider ${tier.unlocked ? "text-neon-green" : tier.current ? "text-neon-purple" : "text-zinc-600"}`}>
                                        Lvl {tier.level}
                                    </div>
                                    <div className="text-[8px] text-zinc-500 truncate">{tier.reward.slice(2)}</div>
                                    <div className={`text-[8px] font-bold ${tier.type === "NFT" ? "text-amber-400" :
                                        tier.type === "Power-up" ? "text-neon-cyan" :
                                            tier.type === "Title" ? "text-neon-purple" :
                                                "text-zinc-500"
                                        }`}>{tier.type}</div>
                                </div>
                            </motion.div>

                            {/* Connector */}
                            {i < tiers.length - 1 && (
                                <div className="w-8 h-[2px] mx-1 relative">
                                    <div className="absolute inset-0 bg-white/10 rounded-full" />
                                    {tier.unlocked && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "100%" }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1, duration: 0.3 }}
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-emerald-400 rounded-full"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between relative overflow-hidden">
                <div className="flex items-center gap-2 text-[10px]">
                    <Gift className="w-3.5 h-3.5 text-neon-purple" />
                    <span className="text-zinc-500">Next reward in</span>
                    <span className="text-neon-purple font-black">1,160 XP</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                    Season ends in <span className="text-white font-bold">42 days</span>
                </div>
            </div>
        </div>
    );
}

/* ─── RPG Player Card ─── */
function PlayerCard() {
    const skills = [
        { name: "Rust", level: 7, maxLevel: 10, xp: 2800, color: "from-orange-500 to-red-500", icon: "🦀" },
        { name: "TypeScript", level: 5, maxLevel: 10, xp: 1500, color: "from-blue-500 to-blue-400", icon: "📘" },
        { name: "Anchor", level: 4, maxLevel: 10, xp: 1200, color: "from-neon-purple to-violet-400", icon: "⚓" },
        { name: "DeFi", level: 2, maxLevel: 10, xp: 400, color: "from-neon-cyan to-emerald-400", icon: "💰" },
        { name: "Security", level: 1, maxLevel: 10, xp: 100, color: "from-red-500 to-pink-500", icon: "🔒" },
    ];

    const rpgStats = [
        { name: "STR", value: 42, label: "Code Power", color: "text-red-400" },
        { name: "INT", value: 68, label: "Problem Solving", color: "text-blue-400" },
        { name: "DEX", value: 55, label: "Debug Speed", color: "text-neon-green" },
        { name: "WIS", value: 38, label: "Architecture", color: "text-neon-purple" },
        { name: "CHA", value: 71, label: "Code Review", color: "text-amber-400" },
    ];

    return (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-neon-cyan" />
                    <span className="text-sm font-black text-white">🎮 Player Card</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold">Preview</span>
            </div>

            <div className="p-5 space-y-5">
                {/* Player identity */}
                <div className="flex items-center gap-4">
                    <motion.div
                        animate={{ borderColor: ["rgba(0,255,163,0.3)", "rgba(153,69,255,0.3)", "rgba(0,240,255,0.3)", "rgba(0,255,163,0.3)"] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-16 h-16 rounded-xl border-2 bg-gradient-to-br from-neon-green/20 to-neon-purple/20 flex items-center justify-center text-2xl relative"
                    >
                        🧑‍💻
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-neon-green to-emerald-400 flex items-center justify-center text-[10px] font-black text-black border-2 border-[#0a0f1a]">
                            7
                        </div>
                    </motion.div>
                    <div>
                        <div className="text-white font-bold flex items-center gap-2">
                            you.sol
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-neon-purple/10 text-neon-purple">Warrior</span>
                        </div>
                        <div className="text-[10px] text-zinc-500">Joined 45 days ago • 8 achievements</div>
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                            <span className="flex items-center gap-0.5 text-orange-400"><Flame className="w-3 h-3" /> 12d</span>
                            <span className="flex items-center gap-0.5 text-neon-green"><Zap className="w-3 h-3" /> 7,340 XP</span>
                            <span className="flex items-center gap-0.5 text-amber-400"><Crown className="w-3 h-3" /> #42</span>
                        </div>
                    </div>
                </div>

                {/* RPG Stats Pentagon (simplified as bars) */}
                <div className="space-y-2">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">⚔️ Combat Stats</div>
                    <div className="grid grid-cols-5 gap-2">
                        {rpgStats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className="text-center"
                            >
                                <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                                <div className="text-[9px] font-black text-white uppercase">{stat.name}</div>
                                <div className="text-[8px] text-zinc-600">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Skill Trees */}
                <div className="space-y-2.5">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">🌿 Skill Trees</div>
                    {skills.map((skill, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            className="space-y-1"
                        >
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-white font-bold flex items-center gap-1.5">
                                    <span>{skill.icon}</span> {skill.name}
                                </span>
                                <span className="text-zinc-500 font-mono">Lvl {skill.level}/{skill.maxLevel}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                    className={`h-full rounded-full bg-gradient-to-r ${skill.color}`}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Daily Quests ─── */
function DailyQuests() {
    const quests = [
        { title: "Complete 1 Lesson", xp: 25, progress: 100, icon: "📖", done: true, type: "Daily" },
        { title: "Pass a Boss Challenge", xp: 75, progress: 60, icon: "⚔️", done: false, type: "Daily" },
        { title: "Review a Peer's Code", xp: 15, progress: 0, icon: "👀", done: false, type: "Daily" },
        { title: "10-Day Streak Milestone", xp: 200, progress: 80, icon: "🔥", done: false, type: "Weekly" },
    ];

    return (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1a]/90 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                        <Target className="w-4 h-4 text-neon-cyan" />
                    </motion.div>
                    <span className="text-sm font-black text-white">🎯 Active Quests</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold">Resets in 8h 24m</span>
            </div>

            <div className="p-4 space-y-2.5">
                {quests.map((q, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all relative overflow-hidden ${q.done
                            ? "border-neon-green/20 bg-neon-green/5"
                            : "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02]"
                            }`}
                    >
                        {q.done && (
                            <motion.div
                                initial={{ x: -200 }}
                                animate={{ x: 400 }}
                                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
                                className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-neon-green/10 to-transparent"
                            />
                        )}
                        <span className="text-lg relative z-10">{q.icon}</span>
                        <div className="flex-1 min-w-0 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${q.done ? "text-neon-green line-through" : "text-white"}`}>
                                    {q.title}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded ${q.type === "Weekly" ? "bg-neon-purple/10 text-neon-purple" : "bg-white/5 text-zinc-500"}`}>
                                    {q.type}
                                </span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${q.progress}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: i * 0.12 }}
                                    className={`h-full rounded-full ${q.done ? "bg-neon-green" : "bg-neon-cyan"}`}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/10 relative z-10">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] font-black text-amber-400">+{q.xp}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">🎁 Daily bonus: Complete all quests for</span>
                    <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-neon-green font-black flex items-center gap-1"
                    >
                        <Zap className="w-3 h-3" /> +150 XP
                    </motion.span>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Section ─── */
export function GamificationShowcase() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400">
                        <Trophy className="w-3 h-3" />
                        Full RPG System
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                        Not a Tutorial.{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">
                            An RPG.
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                        Level up your character. Grow skill trees. Stack combos. Complete daily quests.
                        Earn loot. Climb the arena leaderboard. Every line of code is an attack.
                    </p>
                </motion.div>

                {/* Grid */}
                <div ref={ref} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left column - tall */}
                    <div className="lg:col-span-5 space-y-5">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
                            <PlayerCard />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }}>
                            <DailyQuests />
                        </motion.div>
                    </div>

                    {/* Right column */}
                    <div className="lg:col-span-7 space-y-5">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
                            <LeaderboardPreview />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
                            <AchievementGrid />
                        </motion.div>
                    </div>
                </div>

                {/* Battle Pass - Full width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-5"
                >
                    <BattlePass />
                </motion.div>
            </div>
        </section>
    );
}
