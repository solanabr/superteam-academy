"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMockLeaderboard } from "@/lib/services/mock-leaderboard";

function truncateWallet(wallet: string) {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function LeaderboardSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });

    const top3 = getMockLeaderboard("all-time").slice(0, 3);
    const rankColors = [
        "text-amber-400",
        "text-slate-400",
        "text-amber-700",
    ] as const;

    return (
        <section
            ref={ref}
            className="w-full py-20 bg-zinc-900"
        >
            <div className="mx-auto max-w-4xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center"
                >
                    <p className="mb-2 font-game text-lg tracking-widest text-yellow-400 uppercase">
                        Top Learners
                    </p>
                    <h2 className="text-4xl font-game">
                        Leaderboard
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col gap-3 rounded-2xl border-4 p-6 sm:p-8"
                >
                    {top3.map((entry, i) => (
                        <div
                            key={entry.wallet}
                            className="flex items-center gap-4 rounded-xl border-2 border-zinc-700 px-5 py-4"
                        >
                            <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 ${rankColors[i]}`}
                            >
                                <Trophy className="h-5 w-5" />
                            </div>
                            <span className="w-10 font-game text-xl text-gray-500">
                                #{entry.rank}
                            </span>
                            <span className="flex-1 font-game text-xl">
                                {truncateWallet(entry.wallet)}
                            </span>
                            <span className="font-game text-xl text-yellow-400">
                                {entry.xp.toLocaleString()} XP
                            </span>
                        </div>
                    ))}
                    <Link href="/leaderboard" className="mt-4">
                        <Button variant="pixel" className="w-full font-game text-xl" size="lg">
                            View Full Leaderboard
                            <Trophy className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
