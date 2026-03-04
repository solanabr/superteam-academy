"use client";

import { motion } from "framer-motion";
import { Trophy, Lock, Zap } from "lucide-react";
import { AchievementType, AchievementReceipt } from "@/lib/achievements";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
    achievement: AchievementType;
    receipt?: AchievementReceipt;
    className?: string;
}

export function AchievementCard({ achievement, receipt, className }: AchievementCardProps) {
    const isUnlocked = !!receipt;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative group p-4 border transition-all duration-300 font-mono",
                isUnlocked
                    ? "border-neon-cyan/20 bg-neon-cyan/[0.02] hover:bg-neon-cyan/[0.05] hover:border-neon-cyan/40"
                    : "border-white/5 bg-white/[0.01] opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:border-white/10",
                className
            )}
        >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:10px_10px]" />

            <div className="flex items-center gap-4 relative z-10">
                {/* Badge Image */}
                <div className="relative shrink-0">
                    <div className={cn(
                        "w-16 h-16 border flex items-center justify-center overflow-hidden bg-black/40",
                        isUnlocked ? "border-neon-cyan/30" : "border-white/10"
                    )}>
                        {achievement.badgeImageUrl ? (
                            <img
                                src={achievement.badgeImageUrl}
                                alt={achievement.name}
                                className={cn(
                                    "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
                                    !isUnlocked && "opacity-40"
                                )}
                            />
                        ) : (
                            <Trophy className={cn("w-8 h-8", isUnlocked ? "text-neon-cyan" : "text-zinc-700")} />
                        )}

                        {!isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Lock className="w-4 h-4 text-zinc-500" />
                            </div>
                        )}
                    </div>

                    {/* Decorative corner brackets */}
                    <div className={cn("absolute -top-1 -left-1 w-2 h-2 border-t border-l", isUnlocked ? "border-neon-cyan/50" : "border-white/20")} />
                    <div className={cn("absolute -bottom-1 -right-1 w-2 h-2 border-b border-r", isUnlocked ? "border-neon-cyan/50" : "border-white/20")} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={cn(
                            "text-xs font-black uppercase tracking-wider truncate",
                            isUnlocked ? "text-white" : "text-zinc-500"
                        )}>
                            {achievement.name}
                        </h4>
                        {isUnlocked && (
                            <span className="text-[10px] text-neon-cyan animate-pulse shrink-0">
                                <Trophy className="w-3 h-3" />
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight line-clamp-2">
                        {achievement.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn(
                            "text-[8px] font-black uppercase px-1.5 py-0.5 border flex items-center gap-1",
                            isUnlocked
                                ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                                : "bg-white/5 text-zinc-600 border-white/5"
                        )}>
                            <Zap className="w-2.5 h-2.5" /> +{achievement.xpReward} XP
                        </div>
                        {isUnlocked && receipt?.awardedAt && (
                            <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">
                                Unlocked {new Date(receipt.awardedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Glow effect on hover */}
            {isUnlocked && (
                <div className="absolute inset-0 -z-10 bg-neon-cyan/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            )}
        </motion.div>
    );
}
