"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Sparkles, Zap, Trophy, Flame, Target } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function CTASection() {
    const t = useTranslations("CTA");
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubmitted(true);
            setTimeout(() => setIsSubmitted(false), 3000);
            setEmail("");
        }
    };

    return (
        <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-green/[0.03] to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-neon-green/5 blur-[150px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="relative max-w-4xl mx-auto"
                >
                    <div className="relative overflow-hidden border border-neon-green/20 group">
                        {/* Corner brackets */}
                        <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-neon-green/40 z-20" />
                        <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-neon-green/40 z-20" />
                        <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-neon-green/40 z-20" />
                        <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-neon-green/40 z-20" />

                        {/* Top accent line */}
                        <div className="h-[2px] bg-neon-green" />

                        <div className="relative bg-[#080c14] p-8 md:p-16">
                            {/* Scanline effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,163,0.1) 2px, rgba(0,255,163,0.1) 4px)",
                                }} />
                            </div>

                            <div className="text-center space-y-6 max-w-2xl mx-auto relative z-10">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="flex items-center justify-center gap-3"
                                >
                                    <span className="text-neon-green font-mono text-sm">{">"}</span>
                                    <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                                        {t("initialize")}
                                    </span>
                                </motion.div>

                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight font-mono">
                                    {t("readyToStart")}{" "}
                                    <span className="text-neon-green">{t("quest")}</span>
                                </h2>

                                <p className="text-zinc-400 text-sm leading-relaxed font-mono">
                                    <span className="text-neon-green/60">// </span>
                                    {t("description")}
                                </p>

                                {/* Starting rewards preview */}
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 font-mono">
                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-xs font-bold text-amber-400">+100 {t("xp")}</span>
                                        <span className="text-[10px] text-amber-400/60">{t("signupBonus")}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neon-purple/10 border border-neon-purple/20 font-mono">
                                        <Trophy className="w-3.5 h-3.5 text-neon-purple" />
                                        <span className="text-xs font-bold text-neon-purple">{t("earlyAdopter")}</span>
                                        <span className="text-[10px] text-neon-purple/60">{t("badge")}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-400/10 border border-orange-400/20 font-mono">
                                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                                        <span className="text-xs font-bold text-orange-400">{t("streakFreeze")}</span>
                                        <span className="text-[10px] text-orange-400/60">{t("streakFreezeDesc")}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                    <Link href="/auth" className="w-full sm:w-auto">
                                        <Button
                                            size="lg"
                                            className="w-full sm:w-auto h-14 px-10 text-base font-bold font-mono uppercase tracking-wider bg-neon-green text-black hover:bg-neon-green/90 hover:shadow-[0_0_40px_rgba(0,255,163,0.3)] transition-all duration-300 group btn-hacker"
                                        >
                                            🎮 {t("beginJourney")}
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </div>

                                <div className="pt-8 border-t border-white/5 mt-8">
                                    <p className="text-sm text-zinc-500 mb-4 font-mono">
                                        <span className="text-neon-green/40">$ </span>
                                        {t("subscribeCommand")}
                                    </p>
                                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t("emailPlaceholder")}
                                                className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 text-white text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/20 transition-all"
                                            />
                                        </div>
                                        <Button type="submit" variant="neon" className="h-12 px-6 font-mono font-bold uppercase tracking-wider flex-shrink-0">
                                            {isSubmitted ? t("subscribed") : t("subscribe")}
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}