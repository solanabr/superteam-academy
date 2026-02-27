import {
  Trophy,
  Flame,
  Code2,
  Users,
  Star,
  Shield,
  Zap,
  Crown,
  Rocket,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/lib/services/types";

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  flame: Flame,
  fire: Flame,
  code: Code2,
  users: Users,
  star: Star,
  shield: Shield,
  zap: Zap,
  crown: Crown,
  rocket: Rocket,
};

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md";
}

export function AchievementBadge({
  achievement,
  size = "md",
}: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon] ?? Star;
  const unlocked = !!achievement.unlockedAt;
  const dim = size === "sm" ? "w-12 h-12" : "w-16 h-16";
  const iconDim = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  if (!unlocked) {
    return (
      <div
        className="flex flex-col items-center gap-2 text-center"
        title={achievement.description}
      >
        <div
          className={cn(
            "rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]/50 flex items-center justify-center opacity-40 hover:opacity-60 transition-opacity",
            dim,
          )}
        >
          <Lock
            className={cn(
              size === "sm" ? "h-4 w-4" : "h-5 w-5",
              "text-[var(--c-text-2)]",
            )}
          />
        </div>
        <p className="text-[11px] leading-tight text-[var(--c-text-2)]">
          {achievement.name}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-2 text-center group cursor-pointer"
      title={achievement.description}
    >
      <div
        className={cn(
          "rounded-[2px] flex items-center justify-center border border-[#55E9AB]/30 bg-[#55E9AB]/10 group-hover:bg-[#55E9AB]/15 transition-colors",
          dim,
        )}
      >
        <Icon className={cn(iconDim, "text-[#55E9AB]")} />
      </div>
      <div className="space-y-0.5">
        <p className="text-[11px] leading-tight font-medium text-[#55E9AB]">
          {achievement.name}
        </p>
        <p className="text-[10px] text-[#55E9AB] font-mono font-medium">
          +{achievement.xpReward} XP
        </p>
      </div>
    </div>
  );
}
