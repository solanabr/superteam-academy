"use client";

import type { StreakData } from "@/types";

export function StreakCalendar({ streak }: { streak?: StreakData }) {
  const days = streak?.days.slice(-21) ?? [];
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Streak calendar</p>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {Array.from({ length: 21 }).map((_, index) => {
          const day = days[index];
          return (
            <div
              key={index}
              className={`h-6 rounded ${day?.active ? "bg-[#14F195]/70" : "bg-zinc-800"}`}
              title={day?.date ?? "No activity"}
            />
          );
        })}
      </div>
    </div>
  );
}
