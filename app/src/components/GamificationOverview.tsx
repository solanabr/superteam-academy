"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ACHIEVEMENTS,
  defaultProgress,
  levelFromXp,
  unlockAchievements,
  updateStreak,
  type ProgressState,
} from "@/lib/gamification";

const KEY = "st_academy_progress";

export function GamificationOverview() {
  const [progress, setProgress] = useState<ProgressState>(defaultProgress);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ProgressState) : defaultProgress;
    const today = new Date().toISOString().slice(0, 10);
    const withStreak = updateStreak(parsed, today);
    const withAchievements = unlockAchievements(withStreak);
    setProgress(withAchievements);
    localStorage.setItem(KEY, JSON.stringify(withAchievements));
  }, []);

  const level = useMemo(() => levelFromXp(progress.totalXp), [progress.totalXp]);

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-xs text-zinc-500">XP</div>
        <div className="mt-2 text-3xl font-semibold">{progress.totalXp.toLocaleString()}</div>
        <div className="mt-2 text-xs text-zinc-500">Level: {level}</div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-xs text-zinc-500">Streak</div>
        <div className="mt-2 text-3xl font-semibold">{progress.streakDays} days</div>
        <div className="mt-2 text-xs text-zinc-500">UTC day boundary</div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-xs text-zinc-500">Unlocked achievements</div>
        <div className="mt-2 text-3xl font-semibold">{progress.achievements.length}</div>
        <div className="mt-2 text-xs text-zinc-500">{ACHIEVEMENTS.length} total available</div>
      </div>
    </>
  );
}

export function AchievementBadges() {
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ProgressState) : defaultProgress;
    setAchievements(parsed.achievements);
  }, []);

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {ACHIEVEMENTS.map((achievement) => (
        <span
          key={achievement.id}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            achievements.includes(achievement.id)
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-zinc-50 text-zinc-500"
          }`}
        >
          🏆 {achievement.title}
        </span>
      ))}
    </div>
  );
}
