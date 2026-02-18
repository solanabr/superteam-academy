"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Zap, Users, BookOpen, Trophy } from "lucide-react";

const stats = [
    { label: "Active Builders", value: 12400, suffix: "+", icon: Users, color: "from-neon-green to-emerald-400", iconColor: "text-neon-green" },
    { label: "XP Distributed", value: 8.5, suffix: "M+", decimals: 1, icon: Zap, color: "from-amber-400 to-orange-400", iconColor: "text-amber-400" },
    { label: "Quests Completed", value: 85000, suffix: "+", icon: BookOpen, color: "from-neon-cyan to-blue-400", iconColor: "text-neon-cyan" },
    { label: "NFTs Minted", value: 32000, suffix: "+", icon: Trophy, color: "from-neon-purple to-violet-400", iconColor: "text-neon-purple" },
];

export function Stats() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="relative py-20 overflow-hidden">
            <div className="section-divider absolute top-0 left-0 right-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-green/[0.02] to-transparent" />

            <div ref={ref} className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="relative rounded-xl border border-white/[0.06] bg-[#0a0f1a]/80 p-6 md:p-8 text-center group hover:border-white/10 transition-all duration-300 overflow-hidden">
                                {/* Gradient glow on hover */}
                                <div className={`absolute -inset-1 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.07] blur-xl transition-opacity duration-500 rounded-xl`} />

                                <div className="relative z-10 space-y-3">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={isInView ? { scale: 1 } : {}}
                                        transition={{ delay: index * 0.1 + 0.3, type: "spring", bounce: 0.4 }}
                                        className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${stat.color} p-[1px] mb-2`}
                                    >
                                        <div className="w-full h-full rounded-lg bg-[#0a0f1a] flex items-center justify-center">
                                            <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                                        </div>
                                    </motion.div>

                                    <div className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                                        <AnimatedCounter
                                            value={stat.value}
                                            suffix={stat.suffix}
                                            prefix={stat.prefix || ""}
                                            decimals={stat.decimals || 0}
                                            duration={2.5}
                                        />
                                    </div>
                                    <div className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest font-bold">
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="section-divider absolute bottom-0 left-0 right-0" />
        </section>
    );
}
