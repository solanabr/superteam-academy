"use client";

import { Target, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGamification } from "@/lib/hooks/use-gamification";

const GOAL_OPTIONS = [30, 50, 100] as const;

function GoalRingSVG({
  progress,
  size,
  strokeWidth = 3,
}: {
  progress: number;
  size: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 1) * circumference);
  const isComplete = progress >= 1;

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/50"
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`transition-all duration-500 ${
          isComplete ? "text-brazil-green" : "text-brazil-gold"
        }`}
      />
    </svg>
  );
}

export function DailyGoalMiniRing() {
  const { dailyGoal } = useGamification();
  const progress = dailyGoal.target > 0 ? dailyGoal.xpToday / dailyGoal.target : 0;
  const isComplete = progress >= 1;

  return (
    <div className={`relative flex items-center justify-center ${isComplete ? "animate-goal-complete" : ""}`}>
      <GoalRingSVG progress={progress} size={24} strokeWidth={2.5} />
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? (
          <Check className="h-3 w-3 text-brazil-green" />
        ) : (
          <Target className="h-2.5 w-2.5 text-brazil-gold" />
        )}
      </div>
    </div>
  );
}

export function DailyGoalCard() {
  const t = useTranslations("gamification");
  const { dailyGoal, setDailyGoalTarget } = useGamification();
  const progress = dailyGoal.target > 0 ? dailyGoal.xpToday / dailyGoal.target : 0;
  const isComplete = progress >= 1;

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t("dailyGoal.title")}</p>
          <p className="mt-1 text-3xl font-bold">
            <span className={isComplete ? "text-brazil-green" : "text-brazil-gold"}>
              {dailyGoal.xpToday}
            </span>
            <span className="text-lg text-muted-foreground"> / {dailyGoal.target} XP</span>
          </p>
        </div>
        <div className={`relative flex items-center justify-center ${isComplete ? "animate-goal-complete" : ""}`}>
          <GoalRingSVG progress={progress} size={56} strokeWidth={4} />
          <div className="absolute inset-0 flex items-center justify-center">
            {isComplete ? (
              <Check className="h-6 w-6 text-brazil-green" />
            ) : (
              <span className="text-xs font-bold text-brazil-gold">
                {Math.round(progress * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Target selector */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{t("dailyGoal.goalLabel")}</span>
        {GOAL_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setDailyGoalTarget(option)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              dailyGoal.target === option
                ? "bg-brazil-gold/20 text-brazil-gold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {option} XP
          </button>
        ))}
      </div>
    </div>
  );
}
