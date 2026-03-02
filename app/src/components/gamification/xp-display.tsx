"use client";

import { Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatXp, calculateLevel, calculateXpForLevel } from "@/lib/solana/xp";
import { cn } from "@/lib/utils";

interface XpDisplayProps {
  xp: number;
  compact?: boolean;
  className?: string;
}

export function XpDisplay({ xp, compact = false, className }: XpDisplayProps) {
  const level = calculateLevel(xp);
  const currentLevelXp = calculateXpForLevel(level);
  const nextLevelXp = calculateXpForLevel(level + 1);
  const progress = nextLevelXp > currentLevelXp
    ? Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
    : 100;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5 text-sm", className)}>
        <Zap className="h-4 w-4 text-superteam-green" />
        <span className="font-semibold">{formatXp(xp)}</span>
        <span className="text-muted-foreground">XP</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-superteam-green" />
          <span className="font-bold text-lg">{formatXp(xp)} XP</span>
        </div>
        <span className="text-sm text-muted-foreground">Level {level}</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Level {level}</span>
        <span>{formatXp(nextLevelXp - xp)} XP to Level {level + 1}</span>
      </div>
    </div>
  );
}
