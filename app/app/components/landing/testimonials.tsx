"use client";

import { motion } from "framer-motion";
import { Star, Trophy, Flame, Zap, Crown, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

export function Testimonials() {
    const t = useTranslations("Testimonials");
    
    const testimonials = [
        {
            name: "rafael.sol",
            titleKey: "grandmasterLvl",
            level: 15,
            avatar: "🧑‍💻",
            textKey: "rafaelQuote",
            stars: 5,
            badge: "👑",
            xp: "24,850",
            streak: 45,
        },
        {
            name: "maria.eth",
            titleKey: "championLvl",
            level: 14,
            avatar: "👩‍💻",
            textKey: "mariaQuote",
            stars: 5,
            badge: "⚔️",
            xp: "22,100",
            streak: 32,
        },
        {
            name: "lucas.sol",
            titleKey: "championLvl",
            level: 14,
            avatar: "🧑‍🔬",
            textKey: "lucasQuote",
            stars: 5,
            badge: "🔥",
            xp: "19,800",
            streak: 28,
        },
        {
            name: "ana.dev",
            titleKey: "veteranLvl",
            level: 13,
            avatar: "👩‍🎨",
            textKey: "anaQuote",
            stars: 5,
            badge: "🏆",
            xp: "17,500",
            streak: 21,
        },
        {
            name: "pedro.sol",
            titleKey: "warriorLvl",
            level: 12,
            avatar: "🧑‍🚀",
            textKey: "pedroQuote",
            stars: 4,
            badge: "🛡️",
            xp: "15,200",
            streak: 15,
        },
        {
            name: "sofia.sol",
            titleKey: "veteranLvl",
            level: 13,
            avatar: "👩‍🔧",
            textKey: "sofiaQuote",
            stars: 5,
            badge: "⚓",
            xp: "18,200",
            streak: 19,
        },
    ];

    const row1 = testimonials.slice(0, 3);
    const row2 = testimonials.slice(3, 6);

    return (
        <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/[0.015] to-transparent" />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto mb-12 md:mb-16 space-y-5 px-4"
            >
                <div className="flex items-center gap-3">
                    <span className="text-neon-green font-mono text-sm">{">"}</span>
                    <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                        {t("guildReviews")}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                    {t("whatThe")}{" "}
                    <span className="text-neon-purple">{t("players")}</span>{" "}
                    {t("say")}
                </h2>
                <p className="text-zinc-400 text-sm max-w-xl font-mono leading-relaxed">
                    <span className="text-neon-green/60">// </span>
                    {t("description")}
                </p>
            </motion.div>

            {/* Scrolling rows */}
            <div className="space-y-4">
                {/* Row 1 - scroll left */}
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#020408] to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#020408] to-transparent z-10" />
                    <motion.div
                        animate={{ x: [0, -1200] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="flex"
                    >
                        {[...row1, ...row1, ...row1, ...row1].map((testimonial, i) => (
                            <TestimonialCard key={i} testimonial={testimonial} />
                        ))}
                    </motion.div>
                </div>

                {/* Row 2 - scroll right */}
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#020408] to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#020408] to-transparent z-10" />
                    <motion.div
                        animate={{ x: [-1200, 0] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="flex"
                    >
                        {[...row2, ...row2, ...row2, ...row2].map((testimonial, i) => (
                            <TestimonialCard key={i} testimonial={testimonial} />
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function TestimonialCard({ testimonial }: { testimonial: any }) {
    const t = useTranslations("Testimonials");
    
    return (
        <div className="w-[380px] flex-shrink-0 mx-2 group">
            <div className="border border-white/[0.06] bg-[#0a0f1a]/90 p-5 hover:border-neon-green/20 transition-all duration-300 h-full relative overflow-hidden">
                {/* Corner brackets on hover */}
                <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neon-green/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

                <div className="relative z-10 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-xl bg-white/[0.02]">{testimonial.avatar}</div>
                            <div className="font-mono">
                                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                    {testimonial.name}
                                    <span className="text-base">{testimonial.badge}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-bold">
                                    {t(testimonial.titleKey, { level: testimonial.level })}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                            <div className="flex gap-0.5">
                                {Array.from({ length: testimonial.stars }).map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <div className="text-[9px] text-neon-green font-bold font-mono">
                                {testimonial.xp} {t("xp")}
                            </div>
                        </div>
                    </div>

                    {/* Quote */}
                    <p className="text-sm text-zinc-400 leading-relaxed font-mono">
                        <span className="text-neon-green/40">&gt; </span>
                        &ldquo;{t(testimonial.textKey)}&rdquo;
                    </p>

                    {/* Footer stats */}
                    <div className="flex items-center gap-3 pt-1 font-mono">
                        <span className="flex items-center gap-1 text-[10px] text-orange-400/70 font-bold">
                            <Flame className="w-3 h-3" /> {testimonial.streak}{t("daysStreak")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}