"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export interface LessonProgressProps {
  completed: boolean;
  xpReward: number;
  xpAnimating: boolean;
  onMarkComplete: () => void;
}

export function LessonProgress({
  completed,
  xpReward,
  xpAnimating,
  onMarkComplete,
}: LessonProgressProps) {
  const t = useTranslations("lesson");
  return (
    <div className="relative flex items-center gap-3">
      {xpAnimating && (
        <span className="animate-xp-gain absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold text-xp">
          +{xpReward} XP
        </span>
      )}

      {completed ? (
        <div className="flex items-center gap-1.5 rounded-md bg-brazil-green/10 px-4 py-2 text-sm font-medium text-brazil-green animate-celebration-bounce">
          <CheckCircle2 className="h-4 w-4" />
          {t("completed")}
        </div>
      ) : (
        <button
          onClick={onMarkComplete}
          className="group/btn flex items-center gap-1.5 rounded-md bg-gradient-to-r from-brazil-gold to-brazil-gold-light px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-brazil-gold/20 transition-all duration-200 hover:shadow-xl hover:shadow-brazil-gold/30 hover:-translate-y-0.5 hover:scale-105 active:translate-y-0 active:scale-[0.97]"
        >
          <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover/btn:rotate-12" />
          {t("markComplete")}
        </button>
      )}
    </div>
  );
}
