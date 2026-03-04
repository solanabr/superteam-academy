"use client";

import { TiltCard } from "@/components/ui/tilt-card";
import { Code2, Trophy, Zap, Flame, Shield, Crown } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "next-intl";

/* ─── Mini XP Bar Illustration ─── */
function MiniXPBar() {
    const t = useTranslations("Features");
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-neon-green font-bold">{t("level")} 7</span>
                <span className="text-zinc-600">7,340 / 10,000</span>
            </div>
            <div className="h-1.5 bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "73%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-neon-green"
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
                    className={`w-3 h-3 ${active ? "bg-orange-500/60 border border-orange-500/30" : "bg-white/5 border border-white/[0.03]"}`}
                />
            ))}
        </div>
    );
}

/* ─── Mini Leaderboard ─── */
function MiniLeaderboard() {
    const t = useTranslations("Features");
    const players = [
        { name: "rafael.sol", xp: "24.8K", rank: 1 },
        { name: "maria.eth", xp: "22.1K", rank: 2 },
        { name: t("you"), xp: "7.3K", rank: 42 },
    ];
    return (
        <div className="space-y-1">
            {players.map((p, i) => (
                <div key={i} className={`flex items-center justify-between text-[9px] font-mono px-2 py-1 ${p.rank === 42 ? "bg-neon-cyan/10 border border-neon-cyan/20" : "bg-white/[0.02]"}`}>
                    <span className={`font-bold ${p.rank <= 2 ? "text-amber-400" : "text-neon-cyan"}`}>#{p.rank}</span>
                    <span className="text-zinc-400 font-medium">{p.name}</span>
                    <span className="text-zinc-500">{p.xp}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Mini Achievement Badges ─── */
function MiniBadges() {
    const badges = [
        { emoji: "⭐", earned: true },
        { emoji: "🔥", earned: true },
        { emoji: "⚔️", earned: true },
        { emoji: "👑", earned: false },
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
                    className={`w-8 h-8 border border-neon-green/30 flex items-center justify-center text-xs ${!b.earned ? "opacity-30 grayscale" : ""}`}
                >
                    {b.emoji}
                </motion.div>
            ))}
        </div>
    );
}

/* ─── Mini Code Challenge ─── */
function MiniCodeChallenge() {
    const t = useTranslations("Features");
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5">
                {["✅", "✅", "✅", "⏳", "🔒"].map((s, i) => (
                    <span key={i} className="text-[10px]">{s}</span>
                ))}
                <span className="text-[9px] text-zinc-500 ml-1 font-mono font-bold">3/5 {t("tests")}</span>
            </div>
            <div className="font-mono text-[9px] text-zinc-500 bg-white/[0.02] px-2 py-1 border border-white/[0.04]">
                <span className="text-neon-green">assert_eq!</span><span className="text-zinc-400">(result, 42);</span>
            </div>
        </div>
    );
}

/* ─── Mini NFT Card ─── */
function MiniNFT() {
    const t = useTranslations("Features");
    return (
        <div className="flex items-center gap-2">
            <motion.div
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-10 h-12 border border-amber-500/40 flex items-center justify-center text-base"
            >
                🏅
            </motion.div>
            <div className="font-mono">
                <div className="text-[9px] font-bold text-white">{t("builderNft")}</div>
                <div className="text-[8px] text-amber-400 font-bold">{t("tier")} 3 / 5</div>
                <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 ${i <= 3 ? "bg-amber-400" : "bg-white/10"}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function Features() {
    const t = useTranslations("Features");
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const features = [
        {
            icon: Zap,
            titleKey: "xpLeveling",
            descriptionKey: "xpLevelingDesc",
            glowColor: "rgba(0, 255, 163, 0.12)",
            statKey: "levelFormula",
            iconColor: "text-neon-green",
            illustration: MiniXPBar,
        },
        {
            icon: Trophy,
            titleKey: "soulboundNfts",
            descriptionKey: "soulboundNftsDesc",
            glowColor: "rgba(245, 158, 11, 0.12)",
            statKey: "credentialsIssued",
            iconColor: "text-amber-400",
            illustration: MiniNFT,
        },
        {
            icon: Flame,
            titleKey: "streakSystem",
            descriptionKey: "streakSystemDesc",
            glowColor: "rgba(249, 115, 22, 0.12)",
            statKey: "topStreak",
            iconColor: "text-orange-400",
            illustration: MiniStreak,
        },
        {
            icon: Crown,
            titleKey: "leaderboard",
            descriptionKey: "leaderboardDesc",
            glowColor: "rgba(0, 240, 255, 0.12)",
            statKey: "activeBuilders",
            iconColor: "text-neon-cyan",
            illustration: MiniLeaderboard,
        },
        {
            icon: Shield,
            titleKey: "achievements",
            descriptionKey: "achievementsDesc",
            glowColor: "rgba(153, 69, 255, 0.12)",
            statKey: "rarityTiers",
            iconColor: "text-neon-purple",
            illustration: MiniBadges,
        },
        {
            icon: Code2,
            titleKey: "codeChallenges",
            descriptionKey: "codeChallengesDesc",
            glowColor: "rgba(236, 72, 153, 0.12)",
            statKey: "challengesCount",
            iconColor: "text-pink-400",
            illustration: MiniCodeChallenge,
        },
    ];

    return (
        <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050810] to-transparent" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Terminal-style Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mx-auto mb-16 md:mb-20 space-y-5"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-neon-green font-mono text-sm">{">"}</span>
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                            {t("gameMechanics")}
                        </span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                        {t("yourSkills")}{" "}
                        <span className="text-neon-green">{t("gamified")}</span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl font-mono text-sm leading-relaxed">
                        <span className="text-neon-green/60">// </span>
                        {t("description")}
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
                                    {/* Top: Icon + stat */}
                                    <div className="flex items-center justify-between">
                                        <div className="h-11 w-11 border border-white/[0.08] flex items-center justify-center group-hover:border-neon-green/30 transition-colors">
                                            <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-white/[0.03] border border-white/[0.06]">
                                            <Zap className="w-3 h-3 text-neon-green" />
                                            <span className="text-[9px] font-mono font-bold text-zinc-500">{t(feature.statKey)}</span>
                                        </div>
                                    </div>

                                    {/* Title + Description */}
                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-lg font-black text-white font-mono">{t(feature.titleKey)}</h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed">{t(feature.descriptionKey)}</p>
                                    </div>

                                    {/* Mini Illustration */}
                                    <div className="pt-3 border-t border-white/[0.04]">
                                        <feature.illustration />
                                    </div>
                                </div>

                                {/* Corner brackets */}
                                <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30" />
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30" />
                                <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30" />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30" />
                            </TiltCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}