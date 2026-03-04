"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useProgressStore } from "@/stores/progress-store";
import { getLevel, formatXp } from "@/lib/utils";
import { Flame, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";

export function NavGamification() {
    const { connected } = useWallet();
    const { xp } = useXpBalance();
    const { streakDays } = useProgressStore();

    if (!connected) return null;

    const currentLevel = getLevel(xp);

    return (
        <div className="hidden items-center gap-3 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 backdrop-blur-md md:flex lg:gap-4">
            {/* Level Badge */}
            <div className="flex items-center gap-1.5 font-medium text-primary">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm">Lvl {currentLevel}</span>
            </div>

            <div className="h-4 w-px bg-white/10" aria-hidden="true" />

            {/* XP Counter */}
            <div className="flex items-center gap-1.5 font-medium text-secondary">
                <Zap className="h-4 w-4" aria-hidden="true" />
                <motion.span
                    key={xp}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-sm"
                >
                    {formatXp(xp)} XP
                </motion.span>
            </div>

            <div className="h-4 w-px bg-white/10" aria-hidden="true" />

            {/* Streak Counter */}
            <div className={`flex items-center gap-1.5 font-medium ${streakDays > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
                <Flame className={`h-4 w-4 ${streakDays > 0 ? "fill-orange-500/20" : ""}`} aria-hidden="true" />
                <span className="text-sm">{streakDays}</span>
            </div>
        </div>
    );
}
