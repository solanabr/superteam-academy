"use client";

import {
  Trophy,
  Flame,
  Zap,
  BookOpen,
  Users,
  Crown,
  Shield,
  Code,
  Timer,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Achievement } from "@/types/gamification";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  footprints: Zap,
  zap: Zap,
  "graduation-cap": Award,
  "book-open": BookOpen,
  crown: Crown,
  flame: Flame,
  calendar: Timer,
  trophy: Trophy,
  anchor: Shield,
  hammer: Shield,
  shield: Shield,
  coins: Zap,
  users: Users,
  code: Code,
  timer: Timer,
};

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
}

export function AchievementBadge({
  achievement,
  size = "md",
}: AchievementBadgeProps) {
  const Icon = ICON_MAP[achievement.icon] ?? Trophy;
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center rounded-xl transition-all",
              sizes[size],
              achievement.claimed
                ? "bg-solana-purple/10 text-solana-purple"
                : "bg-muted text-muted-foreground opacity-40",
            )}
          >
            <Icon className={iconSizes[size]} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">
              {achievement.description}
            </p>
            <p className="text-xs text-xp-gold mt-1">
              +{achievement.xpReward} XP
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
