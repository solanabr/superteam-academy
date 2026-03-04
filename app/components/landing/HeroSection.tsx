"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative w-full min-h-screen bg-background p-3 sm:p-5">
            <div className="relative h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:h-[calc(100vh-2.5rem)] sm:rounded-3xl">
                {/* Background scheme from CTA + diagonal cross grid */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-background to-yellow-950/30" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12)_0%,_transparent_60%)]" />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.12) 49%, rgba(255,255,255,0.12) 51%, transparent 51%),
                            linear-gradient(-45deg, transparent 49%, rgba(255,255,255,0.12) 49%, rgba(255,255,255,0.12) 51%, transparent 51%)
                        `,
                        backgroundSize: "40px 40px",
                    }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,6,18,0.45)_62%,rgba(1,3,10,0.72)_100%)]" />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center sm:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-4 py-1.5"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 animate-pulse" />
                        <span className="font-game text-sm uppercase tracking-wider text-yellow-300">
                            Solana Learning Layer
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1 }}
                        className="font-game text-4xl font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl lg:text-8xl"
                    >
                        Master <span className="text-yellow-400">Solana</span>
                        <br />
                        Development
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="mt-5 max-w-3xl font-game text-base text-white/70 sm:text-xl md:text-2xl"
                    >
                        Hands-on courses, soulbound credentials, daily challenges, and real-world projects.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.38 }}
                        className="mt-8 sm:mt-10"
                    >
                        <Link href="/courses/intro-to-solana">
                            <Button
                                variant="pixel"
                                className="animate-glow-pulse px-8 py-6 text-xl font-game sm:px-10 sm:text-2xl"
                            >
                                Get Started
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
