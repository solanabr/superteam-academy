"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Achievement } from "@/types";
import { cn } from "@/lib/utils/cn";

const rarityColors: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  common: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    glow: "shadow-none",
    text: "text-slate-400",
  },
  rare: {
    bg: "bg-[#00C2FF]/10",
    border: "border-[#00C2FF]/30",
    glow: "shadow-[0_0_15px_rgba(0,194,255,0.2)]",
    text: "text-[#00C2FF]",
  },
  epic: {
    bg: "bg-[#9945FF]/10",
    border: "border-[#9945FF]/30",
    glow: "shadow-[0_0_20px_rgba(153,69,255,0.25)]",
    text: "text-[#9945FF]",
  },
  legendary: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    glow: "shadow-[0_0_25px_rgba(234,179,8,0.3)]",
    text: "text-yellow-500",
  },
};

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function AchievementBadge({
  achievement,
  size = "md",
  showDetails = false,
}: AchievementBadgeProps) {
  const colors = rarityColors[achievement.rarity];
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };
  const iconSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <motion.div
      whileHover={achievement.isUnlocked ? { scale: 1.05, y: -2 } : {}}
      className={cn("relative group", !achievement.isUnlocked && "opacity-50")}
    >
      <div
        className={cn(
          "rounded-xl border flex items-center justify-center transition-all duration-300",
          sizeClasses[size],
          colors.bg,
          colors.border,
          achievement.isUnlocked ? colors.glow : "shadow-none",
          "group-hover:scale-105"
        )}
      >
        {achievement.isUnlocked ? (
          <span className={iconSizes[size]}>
            {getCategoryEmoji(achievement.category)}
          </span>
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>

      {achievement.isUnlocked && (
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center border border-background",
            colors.bg,
            colors.text
          )}
        >
          ✓
        </div>
      )}

      {showDetails && (
        <div className="mt-2 text-center">
          <p className={cn("text-xs font-semibold", achievement.isUnlocked ? "text-foreground" : "text-muted-foreground")}>
            {achievement.name}
          </p>
          {achievement.isUnlocked && (
            <p className={cn("text-[10px] font-medium mt-0.5", colors.text)}>
              {achievement.rarity}
            </p>
          )}
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-popover border border-border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <p className="text-xs font-semibold text-foreground">{achievement.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className={cn("text-[10px] font-medium capitalize", colors.text)}>
            {achievement.rarity}
          </span>
          <span className="text-[10px] text-[#14F195]">+{achievement.xpReward} XP</span>
        </div>
        {achievement.unlockedAt && (
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            Unlocked {achievement.unlockedAt.toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    progress: "🎯",
    streak: "🔥",
    skill: "⚡",
    community: "🤝",
    special: "👑",
  };
  return emojis[category] ?? "🏆";
}
