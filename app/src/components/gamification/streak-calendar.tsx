"use client";

import type { StreakData } from "@/types";

const intensityClass = (active: boolean, index: number): string => {
  if (!active) {
    return "bg-zinc-800";
  }
  if (index % 4 === 0) {
    return "bg-[#14F195]/40";
  }
  if (index % 3 === 0) {
    return "bg-[#14F195]/60";
  }
  return "bg-[#14F195]/80";
};

export function StreakCalendar({ streak }: { streak?: StreakData }) {
  const days = streak?.days.slice(-28) ?? [];
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Streak calendar</p>
      <p className="mt-1 text-sm text-zinc-300">Current streak: {streak?.currentStreak ?? 0} days</p>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }).map((_, index) => {
          const day = days[index];
          return (
            <div
              key={index}
              className={`h-5 rounded ${intensityClass(day?.active ?? false, index)}`}
              title={day?.date ?? "No activity"}
            />
          );
        })}
      </div>
    </div>
  );
}
