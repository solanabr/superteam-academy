"use client";

import { motion } from "framer-motion";
import { Zap, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { XPBalance } from "@/types";
import { formatXP, getLevelName, getLevelColor } from "@/lib/utils/xp";
import { cn } from "@/lib/utils/cn";

interface XPDisplayProps {
  xpBalance: XPBalance;
  className?: string;
  compact?: boolean;
}

export function XPDisplay({ xpBalance, className, compact = false }: XPDisplayProps) {
  const levelColor = getLevelColor(xpBalance.level);
  const levelName = getLevelName(xpBalance.level);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: `${levelColor}20`, color: levelColor }}
        >
          {xpBalance.level}
        </div>
        <div>
          <p className="text-sm font-bold">{formatXP(xpBalance.amount)} XP</p>
          <p className="text-xs text-muted-foreground">{levelName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-5", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total XP</p>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" style={{ color: levelColor }} />
            <span className="text-2xl font-bold">{formatXP(xpBalance.amount)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Level</p>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border-2 shadow-lg"
            style={{
              borderColor: levelColor,
              backgroundColor: `${levelColor}15`,
              color: levelColor,
              boxShadow: `0 0 20px ${levelColor}30`,
            }}
          >
            {xpBalance.level}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium" style={{ color: levelColor }}>
            {levelName}
          </span>
          <span className="text-muted-foreground">
            {formatXP(xpBalance.xpToNextLevel)} XP to Level {xpBalance.level + 1}
          </span>
        </div>
        <Progress value={xpBalance.levelProgress} variant="xp" className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatXP(xpBalance.xpForCurrentLevel)}</span>
          <span>{formatXP(xpBalance.xpForCurrentLevel + (xpBalance.amount - xpBalance.xpForCurrentLevel + xpBalance.xpToNextLevel))}</span>
        </div>
      </div>
    </div>
  );
}
