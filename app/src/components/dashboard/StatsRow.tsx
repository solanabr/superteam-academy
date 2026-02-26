import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface StatsRowProps {
    xp: number;
    streak: number;
    rank: string;
    nextRankXP: number;
    className?: string;
}

import { Activity, Flame, Medal } from "lucide-react";

export function StatsRow({ xp, streak, rank, nextRankXP, className }: StatsRowProps) {
    const t = useTranslations("components");
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
            {/* XP Card */}
            <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={40} className="text-white" />
                </div>
                <p className="text-text-muted text-[10px] font-mono uppercase tracking-[0.2em] font-bold">{t("stats_total_xp")}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-4xl font-mono font-bold text-white">{xp.toLocaleString()}</h3>
                    <span className="text-solana text-[10px] font-mono bg-solana/10 px-2 py-0.5 rounded">+450 UP</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                    <div
                        className="h-full bg-solana xp-glow rounded-full"
                        style={{ width: `${Math.min((xp / nextRankXP) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Streak Card */}
            <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <Flame size={40} className="text-rust animate-pulse-glow" fill="currentColor" />
                </div>
                <p className="text-text-muted text-sm font-display uppercase tracking-widest font-semibold">{t("stats_current_streak")}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-mono font-bold text-white">{streak} <span className="text-lg text-text-muted font-normal">{t("stats_days")}</span></h3>
                </div>
                <p className="text-xs text-text-muted">{t("stats_consistency")}</p>
            </div>

            {/* Rank Card */}
            <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Medal size={40} className="text-white" />
                </div>
                <p className="text-text-muted text-sm font-display uppercase tracking-widest font-semibold">{t("stats_current_rank")}</p>
                <h3 className="text-4xl font-display font-bold text-white">{rank}</h3>
                <p className="text-xs text-text-muted">{t("stats_next_rank", { xp: nextRankXP.toLocaleString() })}</p>
            </div>
        </div>
    );
}
