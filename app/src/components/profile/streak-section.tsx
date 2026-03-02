"use client";

import { Flame, Check, Lock } from "lucide-react";
import { ContributionCalendar } from "@/components/gamification/contribution-calendar";
import { StreakFreezeCard } from "@/components/gamification/streak-freeze-card";
import type { StreakData } from "@/types";

const MILESTONES = [
  { days: 7, label: "7d", name: "Week Warrior" },
  { days: 30, label: "30d", name: "Monthly Master" },
  { days: 100, label: "100d", name: "Consistency King" },
] as const;

export function StreakSection({ streak }: { streak: StreakData }) {
  return (
    <section className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 animate-flame text-streak" />
          <h2 className="text-lg font-bold">Streak</h2>
        </div>
        <span className="text-2xl font-bold text-streak">{streak.currentStreak}d</span>
      </div>

      {/* Milestone chips */}
      <div className="mb-4 flex gap-2">
        {MILESTONES.map(({ days, label, name }) => {
          const unlocked = streak.currentStreak >= days || streak.longestStreak >= days;
          return (
            <div
              key={days}
              title={name}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium ${
                unlocked
                  ? "border-streak/30 bg-streak/10 text-streak"
                  : "border-dashed border-muted-foreground/25 bg-muted/20 text-muted-foreground/60"
              }`}
            >
              {unlocked ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              {label}
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="mb-4 flex gap-6 text-sm text-muted-foreground">
        <span>
          Current:{" "}
          <span className="font-semibold text-foreground">{streak.currentStreak}d</span>
        </span>
        <span>
          Longest:{" "}
          <span className="font-semibold text-foreground">{streak.longestStreak}d</span>
        </span>
      </div>

      {/* GitHub-style contribution calendar (52 weeks) */}
      <ContributionCalendar activityCalendar={streak.activityCalendar} />

      {/* Streak freeze badge */}
      <StreakFreezeCard freezes={streak.streakFreezes} />
    </section>
  );
}
