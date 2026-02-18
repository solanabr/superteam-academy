"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, BookOpen, Clock, Star, Zap, Trophy, Flame, Target, Swords, Shield, Crown, Lock, Users, ChevronRight } from "lucide-react";

const paths = [
    {
        title: "Solana Fundamentals",
        description: "Accounts, transactions, programs, and the runtime model.",
        longDesc: "Master the Solana runtime, understand accounts, craft transactions, and deploy your first program. The foundation every builder needs.",
        level: "Beginner",
        difficulty: 1,
        xp: 2500,
        modules: 12,
        lessons: 48,
        duration: "6 weeks",
        boss: "The Validator",
        bossEmoji: "🤖",
        bossHp: 5000,
        color: "from-orange-500 to-amber-400",
        ringColor: "#f97316",
        borderColor: "border-orange-500/30",
        glowColor: "rgba(249,115,22,0.15)",
        textColor: "text-orange-400",
        bgAccent: "bg-orange-500",
        tag: "🌟 Most Popular",
        tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        questIcon: "📜",
        rarity: "Common",
        rarityColor: "text-zinc-400",
        rewards: [
            { name: "Solana Rookie NFT", type: "NFT", emoji: "🏅" },
            { name: "First Steps Badge", type: "Badge", emoji: "⭐" },
        ],
        loot: ["Profile Border", "Title: Initiate"],
        playersActive: 4200,
        completionRate: 78,
    },
    {
        title: "Anchor Framework",
        description: "PDAs, CPIs, Token-2022, Metaplex Core, and full-stack dApps.",
        longDesc: "Build, test, and deploy production programs with Anchor. Master PDAs, cross-program invocations, Token-2022, and Metaplex Core NFTs.",
        level: "Intermediate",
        difficulty: 2,
        xp: 5000,
        modules: 24,
        lessons: 96,
        duration: "10 weeks",
        boss: "The Anchor King",
        bossEmoji: "⚓",
        bossHp: 12000,
        color: "from-neon-green to-emerald-400",
        ringColor: "#00ffa3",
        borderColor: "border-neon-green/30",
        glowColor: "rgba(0,255,163,0.15)",
        textColor: "text-neon-green",
        bgAccent: "bg-neon-green",
        tag: "⚡ Recommended",
        tagColor: "bg-neon-green/10 text-neon-green border-neon-green/20",
        questIcon: "⚔️",
        rarity: "Rare",
        rarityColor: "text-blue-400",
        rewards: [
            { name: "Builder NFT", type: "NFT", emoji: "🛠️" },
            { name: "Anchor Expert Badge", type: "Badge", emoji: "⚓" },
        ],
        loot: ["Animated Avatar", "Title: Builder"],
        playersActive: 3100,
        completionRate: 54,
    },
    {
        title: "DeFi Developer",
        description: "AMMs, lending, oracles, liquidation engines.",
        longDesc: "Build production DeFi protocols from scratch. AMMs, lending markets, oracle integration, liquidation engines, and MEV protection.",
        level: "Advanced",
        difficulty: 3,
        xp: 10000,
        modules: 18,
        lessons: 72,
        duration: "12 weeks",
        boss: "The Liquidator",
        bossEmoji: "💀",
        bossHp: 25000,
        color: "from-neon-cyan to-blue-500",
        ringColor: "#00f0ff",
        borderColor: "border-neon-cyan/30",
        glowColor: "rgba(0,240,255,0.15)",
        textColor: "text-neon-cyan",
        bgAccent: "bg-neon-cyan",
        tag: "🆕 New",
        tagColor: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20",
        questIcon: "🗡️",
        rarity: "Epic",
        rarityColor: "text-neon-purple",
        rewards: [
            { name: "Protocol Dev NFT", type: "NFT", emoji: "💎" },
            { name: "DeFi Master Badge", type: "Badge", emoji: "🏆" },
        ],
        loot: ["Legendary Skin", "Title: Protocol Mage"],
        playersActive: 1800,
        completionRate: 31,
    },
    {
        title: "Solana Security",
        description: "Audit programs, find vulns, secure protocols.",
        longDesc: "Become a security expert. Learn to audit Solana programs, find vulnerabilities, build exploit PoCs, and secure protocols against attacks.",
        level: "Expert",
        difficulty: 4,
        xp: 8000,
        modules: 14,
        lessons: 56,
        duration: "8 weeks",
        boss: "The Exploit",
        bossEmoji: "🐉",
        bossHp: 30000,
        color: "from-red-500 to-rose-400",
        ringColor: "#ef4444",
        borderColor: "border-red-500/30",
        glowColor: "rgba(239,68,68,0.15)",
        textColor: "text-red-400",
        bgAccent: "bg-red-500",
        tag: "🔒 Coming Soon",
        tagColor: "bg-red-500/10 text-red-400 border-red-500/20",
        questIcon: "🛡️",
        rarity: "Legendary",
        rarityColor: "text-amber-400",
        rewards: [
            { name: "Security Expert NFT", type: "NFT", emoji: "🛡️" },
            { name: "Bug Hunter Badge", type: "Badge", emoji: "🐛" },
        ],
        loot: ["Season Champion Skin", "Title: Guardian"],
        playersActive: 920,
        completionRate: 12,
        locked: true,
    },
];

/* ─── Difficulty Stars ─── */
function DifficultyStars({ count, max = 4, color }: { count: number; max?: number; color: string }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: max }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < count ? `fill-current ${color}` : "text-white/10"}`} />
            ))}
        </div>
    );
}

/* ─── Progress Ring ─── */
function ProgressRing({ percent, color, size = 52 }: { percent: number; color: string; size?: number }) {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="-rotate-90" width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    whileInView={{ strokeDashoffset: circ * (1 - percent / 100) }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-white">{percent}%</span>
            </div>
        </div>
    );
}

/* ─── Quest Card ─── */
function QuestCard({ path, index }: { path: typeof paths[number]; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const isLocked = 'locked' in path && path.locked;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative"
        >
            {/* Outer glow on hover */}
            <div
                className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: `radial-gradient(ellipse, ${path.glowColor}, transparent 70%)` }}
            />

            <div className={`relative rounded-2xl border ${isLocked ? "border-white/[0.04]" : "border-white/[0.08] hover:border-white/[0.15]"} bg-[#080c14] overflow-hidden transition-all duration-500 ${isLocked ? "opacity-70" : ""}`}>
                {/* Animated gradient border on top */}
                <div className={`h-[2px] bg-gradient-to-r ${path.color}`} />

                {/* === Card Header === */}
                <div className="p-6 pb-0">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: Quest info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Quest Icon / Boss */}
                            <motion.div
                                whileHover={!isLocked ? { rotate: [0, -10, 10, -5, 0], scale: 1.1 } : {}}
                                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${path.color} p-[1.5px] flex-shrink-0 relative`}
                            >
                                <div className="w-full h-full rounded-xl bg-[#080c14] flex items-center justify-center text-2xl relative">
                                    {isLocked ? <Lock className="w-6 h-6 text-zinc-600" /> : path.questIcon}
                                    {/* Rarity glow ring */}
                                    {!isLocked && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className={`absolute inset-0 rounded-xl border ${path.borderColor}`}
                                        />
                                    )}
                                </div>
                            </motion.div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                                {/* Tags row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${path.tagColor}`}>
                                        {path.tag}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${path.rarityColor}`}>
                                        {path.rarity}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                                    {path.title}
                                </h3>

                                {/* Difficulty + Level */}
                                <div className="flex items-center gap-3">
                                    <DifficultyStars count={path.difficulty} color={path.textColor} />
                                    <span className={`text-xs font-bold ${path.textColor}`}>{path.level}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: XP Reward */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <motion.div
                                animate={!isLocked ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${path.color} relative overflow-hidden`}
                            >
                                <motion.div
                                    animate={{ x: [-80, 120] }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
                                    className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                                <Zap className="w-4 h-4 text-black" />
                                <span className="text-sm font-black text-black">{path.xp.toLocaleString()} XP</span>
                            </motion.div>
                            <ProgressRing percent={path.completionRate} color={path.ringColor} />
                        </div>
                    </div>
                </div>

                {/* === Description === */}
                <div className="px-6 pt-3 pb-4">
                    <p className="text-sm text-zinc-400 leading-relaxed">{path.longDesc}</p>
                </div>

                {/* === Stats Bar === */}
                <div className="px-6 pb-4">
                    <div className="flex items-center gap-4 text-[11px] flex-wrap">
                        <span className="text-zinc-500 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="font-bold text-zinc-300">{path.modules}</span> Modules
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            <span className="font-bold text-zinc-300">{path.lessons}</span> Lessons
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-bold text-zinc-300">{path.duration}</span>
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span className="font-bold text-zinc-300">{path.playersActive.toLocaleString()}</span> Active
                        </span>
                    </div>
                </div>

                {/* === Boss Challenge === */}
                <div className="mx-6 mb-4 p-3 rounded-lg bg-red-500/[0.04] border border-red-500/10">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={!isLocked ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-2xl"
                        >
                            {path.bossEmoji}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <Swords className="w-3 h-3 text-red-400" />
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Final Boss</span>
                            </div>
                            <div className="text-xs font-bold text-white">{path.boss}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-mono text-red-400/60">HP {path.bossHp.toLocaleString()}</div>
                            <div className="w-20 h-1.5 rounded-full bg-red-900/30 overflow-hidden mt-0.5">
                                <div className="h-full rounded-full bg-red-500 w-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* === Loot Drops === */}
                <div className="px-6 pb-4">
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mb-2">🎁 Loot Drops</div>
                    <div className="flex flex-wrap gap-2">
                        {path.rewards.map((r, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.05, y: -2 }}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-default ${r.type === "NFT"
                                    ? "bg-amber-400/5 border-amber-400/20 hover:border-amber-400/40"
                                    : "bg-neon-purple/5 border-neon-purple/20 hover:border-neon-purple/40"
                                    }`}
                            >
                                <span className="text-sm">{r.emoji}</span>
                                <div>
                                    <div className="text-[10px] font-bold text-white">{r.name}</div>
                                    <div className={`text-[8px] font-black uppercase tracking-wider ${r.type === "NFT" ? "text-amber-400" : "text-neon-purple"}`}>
                                        {r.type}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {path.loot.map((l, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                <span className="text-sm">{i === 0 ? "🎨" : "📛"}</span>
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400">{l}</div>
                                    <div className="text-[8px] font-black uppercase tracking-wider text-zinc-600">Cosmetic</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === CTA Footer === */}
                <div className="px-6 py-4 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400/50" /> Avg. 12h/week</span>
                        <span className="text-zinc-700">•</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-400/50" /> {path.completionRate}% completion</span>
                    </div>

                    {isLocked ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-zinc-500 text-sm font-bold">
                            <Lock className="w-4 h-4" />
                            Locked
                        </div>
                    ) : (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                            <Link href="/auth">
                                <Button
                                    size="lg"
                                    className={`bg-gradient-to-r ${path.color} text-black font-black hover:shadow-[0_0_30px_${path.glowColor}] transition-all duration-300 rounded-xl relative overflow-hidden group/btn`}
                                >
                                    <motion.div
                                        animate={{ x: [-100, 200] }}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
                                        className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    />
                                    ⚔️ Begin Quest
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Main Section ─── */
export function LearningPaths() {
    const ref = useRef<HTMLDivElement>(null);

    return (
        <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/[0.015] to-transparent" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neon-cyan">
                            <Swords className="w-3 h-3" />
                            Quest Lines
                        </div>
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                            Choose Your{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
                                Quest
                            </span>
                        </h2>
                        <p className="text-zinc-400 text-lg max-w-xl">
                            Each quest line is an RPG campaign. Defeat bosses, earn soulbound loot,
                            and prove your mastery on-chain.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex items-center gap-3"
                    >
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.06]">
                            <span className="text-[10px] text-zinc-500 font-bold">4 Quests</span>
                            <span className="text-zinc-700">•</span>
                            <span className="text-[10px] text-neon-green font-bold">25,500 Total XP</span>
                        </div>
                        <Link href="/auth">
                            <Button variant="outline" className="text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/10 hover:border-neon-cyan/60 group rounded-xl font-bold">
                                View All
                                <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* Quest Cards Grid */}
                <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paths.map((path, index) => (
                        <QuestCard key={index} path={path} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
