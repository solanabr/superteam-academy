"use client";

import { useTranslations } from "next-intl";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  className?: string;
  showLabel?: boolean;
}

function getStreakColor(streak: number): string {
  if (streak >= 30) return "text-purple-500";
  if (streak >= 14) return "text-red-500";
  if (streak >= 7) return "text-orange-600";
  return "text-orange-400";
}

function getStreakGlow(streak: number): string {
  if (streak >= 30)
    return "drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]";
  if (streak >= 14)
    return "drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]";
  if (streak >= 7)
    return "drop-shadow-[0_0_3px_rgba(234,88,12,0.4)]";
  return "";
}

function getFlameScale(streak: number): string {
  if (streak >= 30) return "h-7 w-7";
  if (streak >= 14) return "h-6 w-6";
  if (streak >= 7) return "h-[1.375rem] w-[1.375rem]";
  return "h-5 w-5";
}

export function StreakBadge({
  streak,
  className,
  showLabel = true,
}: StreakBadgeProps) {
  const t = useTranslations("gamification");

  if (streak <= 0) return null;

  const color = getStreakColor(streak);
  const glow = getStreakGlow(streak);
  const scale = getFlameScale(streak);
  const shouldPulse = streak >= 7;

  return (
    <div
      aria-label={t("streakLabel", { count: streak })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
        streak >= 30
          ? "border-purple-500/30 bg-purple-500/10"
          : streak >= 14
            ? "border-red-500/30 bg-red-500/10"
            : streak >= 7
              ? "border-orange-500/30 bg-orange-500/10"
              : "border-orange-400/30 bg-orange-400/10",
        className
      )}
    >
      <Flame
        aria-hidden="true"
        className={cn(
          scale,
          color,
          glow,
          shouldPulse && "animate-pulse"
        )}
      />
      {showLabel && (
        <span className={cn("text-sm font-semibold", color)}>
          {t("streakDaysShort", { count: streak })}
        </span>
      )}
    </div>
  );
}
