"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { getMockLeaderboard } from "@/lib/services/mock-leaderboard";

function truncateWallet(wallet: string) {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function LeaderboardSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });

    const top3 = getMockLeaderboard("all-time").slice(0, 3);
    const rankColors = [
        "text-amber-500",
        "text-slate-400",
        "text-amber-700",
    ] as const;

    return (
        <section
            ref={ref}
            className="w-full border-y border-border bg-muted/30 py-20"
        >
            <div className="mx-auto max-w-4xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center"
                >
                    <p className="mb-2 text-sm font-medium tracking-widest text-accent uppercase">
                        Top Learners
                    </p>
                    <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                        Leaderboard
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8"
                >
                    {top3.map((entry, i) => (
                        <div
                            key={entry.wallet}
                            className="flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3"
                        >
                            <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-muted ${rankColors[i]}`}
                            >
                                <Trophy className="h-5 w-5" />
                            </div>
                            <span className="w-8 text-sm font-bold text-muted-foreground">
                                #{entry.rank}
                            </span>
                            <span className="flex-1 font-mono text-sm text-foreground">
                                {truncateWallet(entry.wallet)}
                            </span>
                            <span className="text-sm font-semibold text-accent">
                                {entry.xp.toLocaleString()} XP
                            </span>
                        </div>
                    ))}
                    <Link
                        href="/leaderboard"
                        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                    >
                        View full leaderboard
                        <Trophy className="h-4 w-4" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
