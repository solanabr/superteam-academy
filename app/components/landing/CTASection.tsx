"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

export function CTASection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });

    return (
        <section className="w-full py-16 sm:py-24 bg-background">
            <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 px-6 sm:px-12 py-16 sm:py-20 text-center"
                >
                    {/* Rich gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-background to-yellow-950/30" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12)_0%,_transparent_60%)]" />

                    <div className="relative z-10 space-y-5 sm:space-y-6">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-game leading-tight max-w-3xl mx-auto">
                            Ready to start building on{" "}
                            <span className="text-yellow-400">Solana</span>?
                        </h2>

                        <p className="mx-auto max-w-xl font-game text-base sm:text-lg text-muted-foreground leading-relaxed">
                            Join hundreds of developers mastering Solana development
                            with hands-on courses and on-chain credentials.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                            <Link href="/courses/intro-to-solana">
                                <Button
                                    variant="pixel"
                                    size="lg"
                                    className="font-game text-lg sm:text-xl px-8"
                                >
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/courses">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="font-game text-lg sm:text-xl px-8"
                                >
                                    Browse Courses
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
