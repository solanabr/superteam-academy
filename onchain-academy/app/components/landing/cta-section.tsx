"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Sparkles, Zap, Trophy, Flame, Target } from "lucide-react";
import { useState } from "react";

export function CTASection() {
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-neon-green/5 rounded-full blur-[150px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="relative max-w-4xl mx-auto"
                >
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 rounded-2xl p-[1px]">
                            <div className="absolute inset-0 rounded-2xl animate-gradient-rotate" style={{
                                background: "linear-gradient(135deg, #00ffa3, #00f0ff, #9945ff, #00ffa3)",
                                backgroundSize: "300% 300%",
                            }} />
                        </div>

                        <div className="relative bg-[#080c14] rounded-2xl p-8 md:p-16">
                            <div className="text-center space-y-6 max-w-2xl mx-auto">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-xs font-medium text-neon-green"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Free & Open Source
                                </motion.div>

                                <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                                    Ready to start your{" "}
                                    <span className="text-gradient-animated">quest?</span>
                                </h2>

                                <p className="text-zinc-400 text-lg leading-relaxed">
                                    Join 12,400+ builders leveling up their Solana skills. Earn XP,
                                    unlock achievements, and claim your soulbound credentials.
                                </p>

                                {/* Starting rewards preview */}
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
                                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-xs font-bold text-amber-400">+100 XP</span>
                                        <span className="text-[10px] text-amber-400/60">signup bonus</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
                                        <Trophy className="w-3.5 h-3.5 text-neon-purple" />
                                        <span className="text-xs font-bold text-neon-purple">Early Adopter</span>
                                        <span className="text-[10px] text-neon-purple/60">badge</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-400/10 border border-orange-400/20">
                                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                                        <span className="text-xs font-bold text-orange-400">3-day</span>
                                        <span className="text-[10px] text-orange-400/60">streak freeze</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                    <Link href="/auth" className="w-full sm:w-auto">
                                        <Button
                                            size="lg"
                                            className="w-full sm:w-auto h-14 px-10 text-base font-bold bg-gradient-to-r from-neon-green to-emerald-400 text-black hover:shadow-[0_0_40px_rgba(0,0,0,0.4)] transition-all duration-300 group rounded-xl"
                                        >
                                            🎮 Begin Your Journey
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </div>

                                <div className="pt-8 border-t border-white/5 mt-8">
                                    <p className="text-sm text-zinc-500 mb-4">
                                        Get notified about new quest lines and seasonal events:
                                    </p>
                                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="your@email.com"
                                                className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/20 transition-all"
                                            />
                                        </div>
                                        <Button type="submit" variant="neon" className="h-12 px-6 rounded-xl font-semibold flex-shrink-0">
                                            {isSubmitted ? "✓ Subscribed!" : "Subscribe"}
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
