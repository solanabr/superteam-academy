"use client";

import { useTranslations } from "next-intl";
import {
    SectionReveal,
    StaggerContainer,
    staggerItem,
} from "@/components/motion/section-reveal";
import { motion } from "framer-motion";
import { BookOpen, Code2, Shield, Crown } from "lucide-react";

const paths = [
    { key: "beginner", icon: BookOpen, lessons: 24, hours: 12, color: "from-blue-500 to-cyan-400" },
    { key: "intermediate", icon: Code2, lessons: 36, hours: 20, color: "from-solana-purple to-violet-400" },
    { key: "advanced", icon: Shield, lessons: 28, hours: 18, color: "from-orange-500 to-amber-400" },
    { key: "expert", icon: Crown, lessons: 16, hours: 10, color: "from-solana-green to-emerald-400" },
] as const;

export function LearningPaths() {
    const t = useTranslations("LearningPaths");

    return (
        <section id="paths" className="noise-bg section-padding gradient-bg-subtle relative overflow-hidden">
            <div className="glow-purple -top-32 right-[10%]" />
            <div className="glow-green bottom-[10%] -left-32" />
            <div className="content-container relative z-10">
                {/* Section Header */}
                <SectionReveal>
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="inline-block rounded-full bg-solana-purple/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-solana-purple">
                            {t("badge")}
                        </span>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                            {t("title")}
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
                    </div>
                </SectionReveal>

                {/* Progression Line + Cards */}
                <div className="relative mt-16">
                    {/* Vertical progression line (desktop) */}
                    <div className="absolute left-1/2 top-0 bottom-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-solana-purple via-solana-blue to-solana-green lg:block" />

                    <StaggerContainer className="grid gap-6 lg:gap-0">
                        {paths.map(({ key, icon: Icon, lessons, hours, color }, index) => (
                            <motion.div
                                key={key}
                                variants={staggerItem}
                                className={`relative lg:grid lg:grid-cols-2 lg:gap-16 ${index > 0 ? "lg:mt-4" : ""
                                    }`}
                            >
                                {/* Timeline dot */}
                                <div className="absolute left-1/2 top-8 z-10 hidden h-4 w-4 -translate-x-1/2 rounded-full bg-gradient-to-br lg:block" style={{}} >
                                    <div className={`h-full w-full rounded-full bg-gradient-to-br ${color}`} />
                                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${color} animate-ping opacity-20`} />
                                </div>

                                {/* Card */}
                                <div
                                    className={`group rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-solana-purple/5 ${index % 2 === 0
                                        ? "lg:col-start-1 lg:text-right"
                                        : "lg:col-start-2"
                                        }`}
                                >
                                    <div
                                        className={`flex items-start gap-4 ${index % 2 === 0 ? "lg:flex-row-reverse" : ""
                                            }`}
                                    >
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg transition-transform group-hover:scale-110`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-display text-xl font-bold">
                                                {t(`${key}` as "beginner")}
                                            </h3>
                                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                                {t(`${key}Desc` as "beginnerDesc")}
                                            </p>
                                            <div
                                                className={`mt-3 flex gap-3 text-xs text-muted-foreground ${index % 2 === 0 ? "lg:justify-end" : ""
                                                    }`}
                                            >
                                                <span className="rounded-full bg-accent px-2.5 py-0.5 font-medium">
                                                    {t("lessons", { count: lessons })}
                                                </span>
                                                <span className="rounded-full bg-accent px-2.5 py-0.5 font-medium">
                                                    {t("hours", { count: hours })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </StaggerContainer>
                </div>
            </div>
        </section>
    );
}
