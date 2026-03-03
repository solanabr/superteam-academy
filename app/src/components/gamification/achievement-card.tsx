"use client";

import { CheckCircle, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AchievementIcon } from "./achievement-icon";
import type { Achievement } from "@/types";

interface AchievementCardProps {
  achievement: Achievement;
  onClaim?: (id: number) => void;
  className?: string;
}

export function AchievementCard({
  achievement,
  onClaim,
  className,
}: AchievementCardProps) {
  const t = useTranslations("gamification");
  const isClaimed = achievement.claimed;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center rounded-xl p-3 text-center transition-all duration-200",
        isClaimed
          ? "border border-achievement/30 bg-achievement/5 hover:scale-105 hover:-translate-y-0.5 achievement-hover-glow cursor-default"
          : "border border-border bg-muted/20 opacity-60 hover:opacity-80",
        className,
      )}
    >
      {/* Claimed indicator */}
      {isClaimed && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brazil-green text-white">
          <CheckCircle className="h-3 w-3" />
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          isClaimed
            ? "bg-achievement/10 text-achievement"
            : "bg-muted text-muted-foreground",
        )}
      >
        {isClaimed ? (
          <AchievementIcon name={achievement.icon} />
        ) : (
          <Lock className="h-5 w-5" />
        )}
      </div>

      {/* Name */}
      <p className="mt-2 text-xs font-semibold leading-tight">
        {achievement.name}
      </p>

      {/* XP Reward */}
      <p
        className={cn(
          "mt-0.5 text-xs",
          isClaimed ? "text-xp" : "text-muted-foreground",
        )}
      >
        +{achievement.xpReward} XP
      </p>

      {/* Claim button for unclaimed but claimable */}
      {!isClaimed && onClaim && (
        <button
          onClick={() => onClaim(achievement.id)}
          className="mt-2 rounded-md bg-achievement/10 px-2 py-1 text-xs font-medium text-achievement transition-all duration-200 hover:bg-achievement/20 hover:scale-105 active:scale-95"
        >
          {t("claim")}
        </button>
      )}
    </div>
  );
}
