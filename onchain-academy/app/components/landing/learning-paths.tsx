"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, BookOpen, Clock, Star, Zap, Trophy, Flame, Target, Swords, Shield, Crown, Lock, Users, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export const paths = [
    {
        slug: "intro-to-solana",
        titleKey: "solanaFundamentals",
        descriptionKey: "solanaFundamentalsDesc",
        longDescKey: "solanaFundamentalsLongDesc",
        levelKey: "beginner",
        difficulty: 1,
        xp: 2500,
        modules: 12,
        lessons: 48,
        durationKey: "sixWeeks",
        bossKey: "theValidator",
        bossEmoji: "🤖",
        bossHp: 5000,
        ringColor: "#f97316",
        borderColor: "border-orange-500/30",
        glowColor: "rgba(249,115,22,0.15)",
        textColor: "text-orange-400",
        bgAccent: "bg-orange-500",
        tagKey: "mostPopular",
        tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        questIcon: "📜",
        rarityKey: "common",
        rarityColor: "text-zinc-400",
        rewards: [
            { nameKey: "solanaRookieNft", type: "NFT", emoji: "🏅" },
            { nameKey: "firstStepsBadge", type: "Badge", emoji: "⭐" },
        ],
        loot: ["profileBorder", "titleInitiate"],
        playersActive: 4200,
        completionRate: 78,
    },
    {
        slug: "smart-contracts-101",
        titleKey: "anchorFramework",
        descriptionKey: "anchorFrameworkDesc",
        longDescKey: "anchorFrameworkLongDesc",
        levelKey: "intermediate",
        difficulty: 2,
        xp: 5000,
        modules: 24,
        lessons: 96,
        durationKey: "tenWeeks",
        bossKey: "theAnchorKing",
        bossEmoji: "⚓",
        bossHp: 12000,
        ringColor: "#00ffa3",
        borderColor: "border-neon-green/30",
        glowColor: "rgba(0,255,163,0.15)",
        textColor: "text-neon-green",
        bgAccent: "bg-neon-green",
        tagKey: "recommended",
        tagColor: "bg-neon-green/10 text-neon-green border-neon-green/20",
        questIcon: "⚔️",
        rarityKey: "rare",
        rarityColor: "text-blue-400",
        rewards: [
            { nameKey: "builderNft", type: "NFT", emoji: "🛠️" },
            { nameKey: "anchorExpertBadge", type: "Badge", emoji: "⚓" },
        ],
        loot: ["animatedAvatar", "titleBuilder"],
        playersActive: 3100,
        completionRate: 54,
    },
    {
        slug: "defi-on-solana",
        titleKey: "defiDeveloper",
        descriptionKey: "defiDeveloperDesc",
        longDescKey: "defiDeveloperLongDesc",
        levelKey: "advanced",
        difficulty: 3,
        xp: 10000,
        modules: 18,
        lessons: 72,
        durationKey: "twelveWeeks",
        bossKey: "theLiquidator",
        bossEmoji: "💀",
        bossHp: 25000,
        ringColor: "#00f0ff",
        borderColor: "border-neon-cyan/30",
        glowColor: "rgba(0,240,255,0.15)",
        textColor: "text-neon-cyan",
        bgAccent: "bg-neon-cyan",
        tagKey: "new",
        tagColor: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20",
        questIcon: "🗡️",
        rarityKey: "epic",
        rarityColor: "text-neon-purple",
        rewards: [
            { nameKey: "protocolDevNft", type: "NFT", emoji: "💎" },
            { nameKey: "defiMasterBadge", type: "Badge", emoji: "🏆" },
        ],
        loot: ["legendarySkin", "titleProtocolMage"],
        playersActive: 1800,
        completionRate: 31,
    },
    {
        slug: "solana-security",
        titleKey: "solanaSecurity",
        descriptionKey: "solanaSecurityDesc",
        longDescKey: "solanaSecurityLongDesc",
        levelKey: "expert",
        difficulty: 4,
        xp: 8000,
        modules: 14,
        lessons: 56,
        durationKey: "eightWeeks",
        bossKey: "theExploit",
        bossEmoji: "🐉",
        bossHp: 30000,
        ringColor: "#ef4444",
        borderColor: "border-red-500/30",
        glowColor: "rgba(239,68,68,0.15)",
        textColor: "text-red-400",
        bgAccent: "bg-red-500",
        tagKey: "comingSoon",
        tagColor: "bg-red-500/10 text-red-400 border-red-500/20",
        questIcon: "🛡️",
        rarityKey: "legendary",
        rarityColor: "text-amber-400",
        rewards: [
            { nameKey: "securityExpertNft", type: "NFT", emoji: "🛡️" },
            { nameKey: "bugHunterBadge", type: "Badge", emoji: "🐛" },
        ],
        loot: ["seasonChampionSkin", "titleGuardian"],
        playersActive: 920,
        completionRate: 12,
        locked: true,
    },
];

/* ─── Difficulty Stars ─── */
export function DifficultyStars({ count, max = 4, color }: { count: number; max?: number; color: string }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: max }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < count ? `fill-current ${color}` : "text-white/10"}`} />
            ))}
        </div>
    );
}

/* ─── Progress Ring ─── */
export function ProgressRing({ percent, color, size = 52 }: { percent: number; color: string; size?: number }) {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="-rotate-90" width={size} height={size}>
                <rect x="0" y="0" width={size} height={size} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                <motion.rect
                    x="1" y="1" width={size - 2}
                    height={size - 2}
                    fill="none" stroke={color} strokeWidth="2"
                    strokeDasharray={`${(percent / 100) * (2 * (size - 2) + 2 * (size - 2))} ${2 * (size - 2) + 2 * (size - 2)}`}
                    initial={{ strokeDashoffset: 2 * (size - 2) + 2 * (size - 2) }}
                    whileInView={{ strokeDashoffset: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black font-mono text-white">{percent}%</span>
            </div>
        </div>
    );
}

/* ─── Quest Card ─── */
export function QuestCard({
    path,
    index,
    href,
    onBeginQuest
}: {
    path: any;
    index: number;
    href?: string;
    onBeginQuest?: (slug: string) => void
}) {
    const t = useTranslations("LearningPaths");
    const isLocked = 'locked' in path && path.locked;
    const linkHref = href || (isLocked ? "#" : `/courses/${path.slug}`);

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
                className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: `radial-gradient(ellipse, ${path.glowColor}, transparent 70%)` }}
            />

            <div className={`relative border ${isLocked ? "border-white/[0.04]" : "border-white/[0.08] hover:border-white/[0.15]"} bg-[#080c14] overflow-hidden transition-all duration-500 ${isLocked ? "opacity-70" : ""}`}>
                {/* Top accent line */}
                <div className={`h-[2px] ${path.bgAccent || "bg-zinc-700"}`} />

                {/* Corner brackets */}
                <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

                {/* === Card Header === */}
                <div className="p-6 pb-0">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: Quest info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <motion.div
                                whileHover={!isLocked ? { rotate: [0, -10, 10, -5, 0], scale: 1.1 } : {}}
                                className={`w-16 h-16 border ${isLocked ? "border-white/10" : path.borderColor} bg-white/[0.02] flex-shrink-0 relative flex items-center justify-center text-2xl overflow-hidden`}
                            >
                                {isLocked ? (
                                    <Lock className="w-6 h-6 text-zinc-600" />
                                ) : (path as any).thumbnail ? (
                                    <img src={(path as any).thumbnail} alt={t(path.titleKey)} className="w-full h-full object-cover" />
                                ) : (
                                    path.questIcon
                                )}
                                {!isLocked && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className={`absolute inset-0 border ${path.borderColor}`}
                                    />
                                )}
                            </motion.div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                                {/* Tags row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[9px] font-black font-mono uppercase tracking-widest px-2 py-0.5 border ${path.tagColor || "border-white/10 text-zinc-500"}`}>
                                        {t(path.tagKey) || t("course")}
                                    </span>
                                    <span className={`text-[9px] font-black font-mono uppercase tracking-widest ${path.rarityColor || "text-zinc-600"}`}>
                                        {t(path.rarityKey) || t("standard")}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl md:text-2xl font-black font-mono text-white">
                                    {t(path.titleKey)}
                                </h3>

                                {/* Difficulty + Level */}
                                <div className="flex items-center gap-3">
                                    <DifficultyStars count={path.difficulty || 1} color={path.textColor || "text-zinc-500"} />
                                    <span className={`text-xs font-bold font-mono ${path.textColor || "text-zinc-400"}`}>{t(path.levelKey) || t("starter")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: XP Reward */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <motion.div
                                animate={!isLocked ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 ${path.bgAccent || "bg-zinc-800"} relative overflow-hidden`}
                            >
                                <Zap className="w-4 h-4 text-black" />
                                <span className="text-sm font-black font-mono text-black">{(path.xp || 0).toLocaleString()} {t("xp")}</span>
                            </motion.div>
                            <ProgressRing percent={path.completionRate || 0} color={path.ringColor || "#ffffff"} />
                        </div>
                    </div>
                </div>

                {/* === Description === */}
                <div className="px-6 pt-3 pb-4">
                    <p className="text-sm text-zinc-400 leading-relaxed font-mono">{t(path.longDescKey) || t(path.descriptionKey)}</p>
                </div>

                {/* === Stats Bar === */}
                <div className="px-6 pb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 text-[11px] font-mono">
                            <span className="text-zinc-500 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span className="font-bold text-zinc-300">{path.modules || 0}</span> {t("modules")}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-500 flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5" />
                                <span className="font-bold text-zinc-300">{path.lessons || 0}</span> {t("lessons")}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-500 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="font-bold text-zinc-300">{t(path.durationKey) || "N/A"}</span>
                            </span>
                        </div>

                        {/* Author Info */}
                        {(path as any).author && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">{t("by")}</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.02] border border-white/[0.05]">
                                    {(path as any).author.avatar && (
                                        <img src={(path as any).author.avatar} alt={(path as any).author.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                                    )}
                                    <span className="text-[10px] font-bold text-zinc-400 font-mono">{(path as any).author.name}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* === Boss Challenge === */}
                <div className="mx-6 mb-4 p-3 bg-red-500/[0.04] border border-red-500/10">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={!isLocked ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-2xl"
                        >
                            {path.bossEmoji || "👾"}
                        </motion.div>
                        <div className="flex-1 min-w-0 font-mono">
                            <div className="flex items-center gap-2">
                                <Swords className="w-3 h-3 text-red-400" />
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">{t("finalBoss")}</span>
                            </div>
                            <div className="text-xs font-bold text-white">{t(path.bossKey) || t("unknownFoe")}</div>
                        </div>
                        <div className="text-right font-mono">
                            <div className="text-[10px] text-red-400/60">{t("hp")} {(path.bossHp || 0).toLocaleString()}</div>
                            <div className="w-20 h-1.5 bg-red-900/30 overflow-hidden mt-0.5">
                                <div className="h-full bg-red-500 w-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* === Loot Drops === */}
                <div className="px-6 pb-4">
                    <div className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-mono font-black mb-2">
                        <span className="text-neon-green/60">// </span>{t("lootDrops")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(path.rewards || []).map((r: { nameKey: string; type: string; emoji: string }, i: number) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.05, y: -2 }}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 border transition-all cursor-default font-mono ${r.type === "NFT"
                                    ? "bg-amber-400/5 border-amber-400/20 hover:border-amber-400/40"
                                    : "bg-neon-purple/5 border-neon-purple/20 hover:border-neon-purple/40"
                                    }`}
                            >
                                <span className="text-sm">{r.emoji}</span>
                                <div>
                                    <div className="text-[10px] font-bold text-white">{t(r.nameKey)}</div>
                                    <div className={`text-[8px] font-black uppercase tracking-wider ${r.type === "NFT" ? "text-amber-400" : "text-neon-purple"}`}>
                                        {r.type}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {(path.loot || []).map((l: string, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] font-mono">
                                <span className="text-sm">{i === 0 ? "🎨" : "📛"}</span>
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400">{t(l)}</div>
                                    <div className="text-[8px] font-black uppercase tracking-wider text-zinc-600">{t("cosmetic")}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === CTA Footer === */}
                <div className="px-6 py-4 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between font-mono">
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-neon-cyan/50" /> {(path as any).enrollmentCount || (path as any).playersActive || 0} {t("enrolled")}</span>
                        <span className="text-zinc-700">•</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-400/50" /> {path.completionRate || 0}% {t("completion")}</span>
                    </div>

                    {isLocked ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 text-zinc-500 text-sm font-bold border border-white/[0.06]">
                            <Lock className="w-4 h-4" />
                            {t("locked")}
                        </div>
                    ) : (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                            {onBeginQuest ? (
                                <Button
                                    onClick={() => onBeginQuest(path.slug)}
                                    size="lg"
                                    className={`btn-hacker ${path.bgAccent || "bg-white/10"} ${path.textColor?.includes('black') ? 'text-black' : 'text-white'} font-black font-mono uppercase tracking-wider transition-all duration-300 relative overflow-hidden group/btn`}
                                >
                                    ⚔️ {t("beginQuest")}
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            ) : (
                                <Link href={linkHref}>
                                    <Button
                                        size="lg"
                                        className={`btn-hacker ${path.bgAccent || "bg-white/10"} ${path.textColor?.includes('black') ? 'text-black' : 'text-white'} font-black font-mono uppercase tracking-wider transition-all duration-300 relative overflow-hidden group/btn`}
                                    >
                                        ⚔️ {t("beginQuest")}
                                        <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Main Section ─── */
export function LearningPaths() {
    const t = useTranslations("LearningPaths");
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
                        className="space-y-5"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-neon-green font-mono text-sm">{">"}</span>
                            <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                                {t("questLines")}
                            </span>
                            <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                            {t("chooseYour")}{" "}
                            <span className="text-neon-cyan">{t("quest")}</span>
                        </h2>
                        <p className="text-zinc-400 text-sm max-w-xl font-mono leading-relaxed">
                            <span className="text-neon-green/60">// </span>
                            {t("description")}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex items-center gap-3"
                    >
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/[0.06] font-mono">
                            <span className="text-[10px] text-zinc-500 font-bold">4 {t("quests")}</span>
                            <span className="text-zinc-700">•</span>
                            <span className="text-[10px] text-neon-green font-bold">25,500 {t("totalXp")}</span>
                        </div>
                        <Link href="/auth">
                            <Button variant="outline" className="btn-slide-right text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/10 hover:border-neon-cyan/60 group font-bold font-mono uppercase tracking-wider overflow-hidden relative">
                                <span className="relative z-10">{t("viewAll")}</span>
                                <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* Quest Cards Grid */}
                <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paths.map((path, index) => (
                        <QuestCard key={index} path={path} index={index} href="/auth" />
                    ))}
                </div>
            </div>
        </section>
    );
}