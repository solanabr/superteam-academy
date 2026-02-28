"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Zap, Users, BookOpen, Trophy, LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface StatItem {
    label: string;
    value: number;
    suffix: string;
    prefix?: string;
    decimals?: number;
    icon: LucideIcon;
    iconColor: string;
}

export function Stats() {
    const t = useTranslations("Stats");
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const stats: StatItem[] = [
        { 
            label: t("activeBuilders"), 
            value: 12400, 
            suffix: "+", 
            icon: Users, 
            iconColor: "text-neon-green" 
        },
        { 
            label: t("xpDistributed"), 
            value: 8.5, 
            suffix: "M+", 
            decimals: 1, 
            icon: Zap, 
            iconColor: "text-amber-400" 
        },
        { 
            label: t("questsCompleted"), 
            value: 85000, 
            suffix: "+", 
            icon: BookOpen, 
            iconColor: "text-neon-cyan" 
        },
        { 
            label: t("nftsMinted"), 
            value: 32000, 
            suffix: "+", 
            icon: Trophy, 
            iconColor: "text-neon-purple" 
        },
    ];

    return (
        <section className="relative py-20 overflow-hidden">
            <div className="section-divider absolute top-0 left-0 right-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-green/[0.02] to-transparent" />

            <div ref={ref} className="container mx-auto px-4 md:px-6">
                {/* Terminal-style heading */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="mb-10 flex items-center gap-3"
                >
                    <span className="text-neon-green font-mono text-sm">{t("terminalPrefix")}</span>
                    <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                        {t("systemStats")}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                        {t("live")}
                    </span>
                    <span className="w-1.5 h-1.5 bg-neon-green animate-pulse" />
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="btn-hacker relative border border-white/[0.06] bg-[#0a0f1a]/80 p-6 md:p-8 text-center group hover:border-neon-green/40 transition-all duration-300 overflow-hidden">
                                {/* Scanline hover glow */}
                                <div className="absolute inset-0 bg-neon-green/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative z-10 space-y-3">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={isInView ? { scale: 1 } : {}}
                                        transition={{ delay: index * 0.1 + 0.3, type: "spring", bounce: 0.4 }}
                                        className="w-10 h-10 mx-auto border border-neon-green/30 mb-2 flex items-center justify-center"
                                    >
                                        <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                                    </motion.div>

                                    <div className="text-3xl md:text-4xl lg:text-5xl font-mono font-black text-white tracking-tight">
                                        <AnimatedCounter
                                            value={stat.value}
                                            suffix={stat.suffix}
                                            prefix={stat.prefix || ""}
                                            decimals={stat.decimals || 0}
                                            duration={2.5}
                                        />
                                    </div>
                                    <div className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.2em] font-mono font-bold">
                                        {stat.label}
                                    </div>
                                </div>

                                {/* Corner brackets */}
                                <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="section-divider absolute bottom-0 left-0 right-0" />
        </section>
    );
}