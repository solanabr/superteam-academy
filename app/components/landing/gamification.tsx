"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "@/components/motion/section-reveal";
import { motion } from "framer-motion";
import { Flame, Trophy, Star, Zap, TrendingUp } from "lucide-react";

const weeklyData = [40, 65, 45, 80, 55, 90, 70];
const days = ["M", "T", "W", "T", "F", "S", "S"];

export function Gamification() {
    const t = useTranslations("Gamification");

    return (
        <section className="noise-bg section-padding gradient-bg-subtle relative overflow-hidden">
            <div className="glow-purple top-[5%] right-[20%]" />
            <div className="glow-green bottom-[20%] -left-24" />
            <div className="content-container relative z-10">
                {/* Section Header */}
                <SectionReveal>
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-500">
                            {t("badge")}
                        </span>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                            {t("title")}
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            {t("subtitle")}
                        </p>
                    </div>
                </SectionReveal>

                {/* Stats and Visualization */}
                <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* XP & Level Card */}
                    <SectionReveal delay={0.1}>
                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solana-purple/10">
                                        <Star className="h-5 w-5 text-solana-purple" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("level")}</p>
                                        <p className="font-display text-lg font-bold">14</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{t("xp")}</p>
                                    <p className="font-display text-lg font-bold gradient-text">
                                        2,847
                                    </p>
                                </div>
                            </div>

                            {/* XP Progress Bar */}
                            <div className="mt-5 space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{t("currentLevel")}</span>
                                    <span>{t("nextLevel")}</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-green"
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "68%" }}
                                        transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                                        viewport={{ once: true }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t("toNextLevel", { count: "653" })}
                                </p>
                            </div>
                        </div>
                    </SectionReveal>

                    {/* Streak Card */}
                    <SectionReveal delay={0.2}>
                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{t("streak")}</p>
                                    <p className="font-display text-3xl font-bold">12</p>
                                </div>
                            </div>

                            {/* Streak dots */}
                            <div className="mt-5 flex justify-between">
                                {days.map((day, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1.5">
                                        <motion.div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${i < 5
                                                ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white"
                                                : i === 5
                                                    ? "border-2 border-dashed border-orange-500/40 text-orange-500"
                                                    : "border border-border text-muted-foreground"
                                                }`}
                                            initial={{ scale: 0 }}
                                            whileInView={{ scale: 1 }}
                                            transition={{ delay: 0.3 + i * 0.05, type: "spring" }}
                                            viewport={{ once: true }}
                                        >
                                            {i < 5 ? "✓" : ""}
                                        </motion.div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {day}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SectionReveal>

                    {/* Weekly Chart Card */}
                    <SectionReveal delay={0.3}>
                        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm md:col-span-2 lg:col-span-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-solana-green/10">
                                        <TrendingUp className="h-5 w-5 text-solana-green" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            {t("weeklyXp")}
                                        </p>
                                        <p className="font-display text-lg font-bold">445</p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-solana-green/10 px-2 py-0.5 text-xs font-semibold text-solana-green">
                                    +23%
                                </span>
                            </div>

                            {/* Bar Chart */}
                            <div className="mt-5 flex items-end justify-between gap-2 h-24">
                                {weeklyData.map((value, i) => (
                                    <div
                                        key={i}
                                        className="relative flex flex-1 flex-col items-center"
                                    >
                                        <motion.div
                                            className={`w-full rounded-t-md ${i === 5
                                                ? "bg-gradient-to-t from-solana-purple to-solana-green"
                                                : "bg-accent"
                                                }`}
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${value}%` }}
                                            transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                                            viewport={{ once: true }}
                                        />
                                        <span className="mt-1.5 text-[10px] text-muted-foreground">
                                            {days[i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SectionReveal>
                </div>

                {/* Achievements Row */}
                <SectionReveal delay={0.4}>
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        {[
                            { icon: Zap, label: "First Transaction", earned: true },
                            { icon: Code2Icon, label: "10 Challenges", earned: true },
                            { icon: Trophy, label: "Path Complete", earned: false },
                        ].map((achievement, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${achievement.earned
                                    ? "border-solana-purple/30 bg-solana-purple/5 text-foreground"
                                    : "border-border/60 text-muted-foreground opacity-50"
                                    }`}
                            >
                                <achievement.icon className="h-4 w-4" />
                                <span>{achievement.label}</span>
                            </div>
                        ))}
                    </div>
                </SectionReveal>
            </div>
        </section>
    );
}

// Small inline icon for the code challenge badge
function Code2Icon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m18 16 4-4-4-4" />
            <path d="m6 8-4 4 4 4" />
            <path d="m14.5 4-5 16" />
        </svg>
    );
}
