"use client";

import { TiltCard } from "@/components/ui/tilt-card";
import { Code2, Trophy, Zap, Gamepad2, Flame, Shield, Crown, Star, Target } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/* ─── Mini XP Bar Illustration ─── */
function MiniXPBar() {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px]">
                <span className="text-neon-green font-bold">Lvl 7</span>
                <span className="text-zinc-600 font-mono">7,340 / 10,000</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "73%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-neon-green to-emerald-400"
                />
            </div>
        </div>
    );
}

/* ─── Mini Streak Calendar ─── */
function MiniStreak() {
    const days = [true, true, true, true, true, false, true, true, true, true, true, true, false, true];
    return (
        <div className="flex gap-[3px]">
            {days.map((active, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className={`w-3 h-3 rounded-sm ${active ? "bg-orange-500/60 border border-orange-500/30" : "bg-white/5 border border-white/[0.03]"}`}
                />
            ))}
        </div>
    );
}

/* ─── Mini Leaderboard ─── */
function MiniLeaderboard() {
    const players = [
        { name: "rafael.sol", xp: "24.8K", rank: 1 },
        { name: "maria.eth", xp: "22.1K", rank: 2 },
        { name: "you", xp: "7.3K", rank: 42 },
    ];
    return (
        <div className="space-y-1">
            {players.map((p, i) => (
                <div key={i} className={`flex items-center justify-between text-[9px] px-2 py-1 rounded ${p.rank === 42 ? "bg-neon-cyan/10 border border-neon-cyan/20" : "bg-white/[0.02]"}`}>
                    <span className={`font-bold ${p.rank <= 2 ? "text-amber-400" : "text-neon-cyan"}`}>#{p.rank}</span>
                    <span className="text-zinc-400 font-medium">{p.name}</span>
                    <span className="text-zinc-500 font-mono">{p.xp}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Mini Achievement Badges ─── */
function MiniBadges() {
    const badges = [
        { emoji: "⭐", color: "from-emerald-400 to-neon-green", earned: true },
        { emoji: "🔥", color: "from-orange-400 to-amber-400", earned: true },
        { emoji: "⚔️", color: "from-neon-cyan to-blue-400", earned: true },
        { emoji: "👑", color: "from-amber-400 to-yellow-300", earned: false },
    ];
    return (
        <div className="flex gap-1.5">
            {badges.map((b, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, type: "spring", bounce: 0.4 }}
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${b.color} p-[1px] ${!b.earned ? "opacity-30 grayscale" : ""}`}
                >
                    <div className="w-full h-full rounded-lg bg-[#0a0f1a] flex items-center justify-center text-xs">
                        {b.emoji}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

/* ─── Mini Code Challenge ─── */
function MiniCodeChallenge() {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5">
                {["✅", "✅", "✅", "⏳", "🔒"].map((s, i) => (
                    <span key={i} className="text-[10px]">{s}</span>
                ))}
                <span className="text-[9px] text-zinc-500 ml-1 font-bold">3/5 tests</span>
            </div>
            <div className="font-mono text-[9px] text-zinc-500 bg-white/[0.02] rounded px-2 py-1 border border-white/[0.04]">
                <span className="text-neon-green">assert_eq!</span><span className="text-zinc-400">(result, 42);</span>
            </div>
        </div>
    );
}

/* ─── Mini NFT Card ─── */
function MiniNFT() {
    return (
        <div className="flex items-center gap-2">
            <motion.div
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-10 h-12 rounded-md bg-gradient-to-br from-amber-500 to-orange-400 p-[1px]"
            >
                <div className="w-full h-full rounded-md bg-[#0a0f1a] flex items-center justify-center text-base">
                    🏅
                </div>
            </motion.div>
            <div>
                <div className="text-[9px] font-bold text-white">Builder NFT</div>
                <div className="text-[8px] text-amber-400 font-bold">Tier 3 / 5</div>
                <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 3 ? "bg-amber-400" : "bg-white/10"}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

const features = [
    {
        icon: Zap,
        title: "XP & Leveling",
        description: "Earn soulbound XP tokens on Solana for every lesson and challenge. Your power grows with every line of code.",
        gradient: "from-neon-green to-emerald-400",
        glowColor: "rgba(0, 255, 163, 0.12)",
        stat: "Level formula: √(XP/100)",
        illustration: MiniXPBar,
    },
    {
        icon: Trophy,
        title: "Soulbound NFTs",
        description: "Earn evolving Metaplex Core NFTs that upgrade in-place as you progress. Proof of mastery, on-chain.",
        gradient: "from-amber-500 to-orange-400",
        glowColor: "rgba(245, 158, 11, 0.12)",
        stat: "32,000+ credentials issued",
        illustration: MiniNFT,
    },
    {
        icon: Flame,
        title: "Streak System",
        description: "Maintain daily streaks. Hit milestones at 7, 30, and 100 days. Streak freezes for when life happens.",
        gradient: "from-orange-500 to-red-400",
        glowColor: "rgba(249, 115, 22, 0.12)",
        stat: "Top streak: 247 days",
        illustration: MiniStreak,
    },
    {
        icon: Crown,
        title: "Leaderboard",
        description: "Compete with builders worldwide. Weekly, monthly, and all-time rankings derived from on-chain XP.",
        gradient: "from-neon-cyan to-blue-500",
        glowColor: "rgba(0, 240, 255, 0.12)",
        stat: "12,400+ active builders",
        illustration: MiniLeaderboard,
    },
    {
        icon: Shield,
        title: "Achievements",
        description: "Unlock 256 achievements across progress, skills, streaks, and community. Five rarity tiers from Common to Legendary.",
        gradient: "from-neon-purple to-violet-400",
        glowColor: "rgba(153, 69, 255, 0.12)",
        stat: "5 rarity tiers",
        illustration: MiniBadges,
    },
    {
        icon: Code2,
        title: "Code Challenges",
        description: "Write Rust and TypeScript in-browser with real-time test feedback and instant XP on completion.",
        gradient: "from-pink-500 to-rose-400",
        glowColor: "rgba(236, 72, 153, 0.12)",
        stat: "200+ challenges",
        illustration: MiniCodeChallenge,
    },
];

export function Features() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050810] to-transparent" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neon-green">
                        <Gamepad2 className="w-3 h-3" />
                        Game Mechanics
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                        Your Skills,{" "}
                        <span className="text-gradient-animated">Gamified</span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                        Every interaction earns rewards. Every milestone unlocks new abilities.
                        This isn&apos;t a tutorial — it&apos;s a quest.
                    </p>
                </motion.div>

                {/* Feature Grid */}
                <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <TiltCard className="h-full" glowColor={feature.glowColor}>
                                <div className="p-6 md:p-7 flex flex-col gap-5 min-h-[300px]">
                                    {/* Top: Icon */}
                                    <div className="flex items-center justify-between">
                                        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${feature.gradient} p-[1px]`}>
                                            <div className="h-full w-full rounded-xl bg-[#080c14] flex items-center justify-center">
                                                <feature.icon className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
                                            <Zap className="w-3 h-3 text-neon-green" />
                                            <span className="text-[9px] font-bold text-zinc-500">{feature.stat}</span>
                                        </div>
                                    </div>

                                    {/* Title + Description */}
                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-lg font-black text-white">{feature.title}</h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                                    </div>

                                    {/* Mini Illustration */}
                                    <div className="pt-3 border-t border-white/[0.04]">
                                        <feature.illustration />
                                    </div>
                                </div>
                            </TiltCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
