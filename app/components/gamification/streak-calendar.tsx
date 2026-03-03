"use client";
import { useEffect, useState } from "react";

export function StreakCalendar() {
  const [activity, setActivity] = useState<Record<string, boolean>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("streak_activity") || "{}");
    const today = new Date().toISOString().split("T")[0];
    stored[today] = true;
    localStorage.setItem("streak_activity", JSON.stringify(stored));
    setActivity(stored);

    // Calculate streak
    let count = 0;
    const d = new Date();
    while (stored[d.toISOString().split("T")[0]]) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    setStreak(count);
  }, []);

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔥</span>
        <span className="font-bold text-lg">{streak} day streak</span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {days.map(day => (
          <div key={day} title={day}
            className={"w-6 h-6 rounded-sm " + (activity[day] ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        <span>🎯 7 days: bonus XP</span>
        <span>⚡ 30 days: achievement</span>
        <span>👑 100 days: legend</span>
      </div>
    </div>
  );
}