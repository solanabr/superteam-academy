"use client";

import { useMemo, useState, useEffect } from "react";
import { getCalendarData, getMilestones, getStreak, getFreezeCount, type StreakMilestone } from "@/lib/streak";
import { useTranslations } from "next-intl";

export function StreakCalendar() {
  const t = useTranslations("dashboard");
  const [calendarData, setCalendarData] = useState<{ date: string; active: boolean }[]>([]);
  const [milestones, setMilestones] = useState<StreakMilestone[]>([]);
  const [streak, setStreak] = useState(0);
  const [freezes, setFreezes] = useState(0);

  useEffect(() => {
    setCalendarData(getCalendarData(84));
    setMilestones(getMilestones());
    setStreak(getStreak());
    setFreezes(getFreezeCount());
  }, []);

  const weeks = useMemo(() => {
    const result: { date: string; active: boolean }[][] = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      result.push(calendarData.slice(i, i + 7));
    }
    return result;
  }, [calendarData]);

  return (
    <div className="space-y-6">
      {/* Streak header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-400/10">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <p className="text-2xl font-black text-content">
              {streak} <span className="text-sm font-normal text-content-muted">{t("dayStreak")}</span>
            </p>
          </div>
        </div>
        {freezes > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5">
            <span className="text-sm">🧊</span>
            <span className="text-xs font-medium text-cyan-400">{freezes} {t("freezesLeft")}</span>
          </div>
        )}
      </div>

      {/* Calendar heatmap */}
      <div className="overflow-x-auto rounded-xl border border-edge-soft bg-card p-4">
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`h-3 w-3 rounded-sm transition-colors ${
                    day.active
                      ? "bg-solana-green/80"
                      : "bg-edge"
                  }`}
                  title={day.date}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-content-muted">
          <span>{t("less")}</span>
          <div className="h-2.5 w-2.5 rounded-sm bg-edge" />
          <div className="h-2.5 w-2.5 rounded-sm bg-solana-green/30" />
          <div className="h-2.5 w-2.5 rounded-sm bg-solana-green/60" />
          <div className="h-2.5 w-2.5 rounded-sm bg-solana-green/80" />
          <span>{t("more")}</span>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
          {t("milestones")}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {milestones.map((m) => (
            <div
              key={m.days}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                m.achieved
                  ? "border-solana-green/30 bg-solana-green/5"
                  : "border-edge-soft bg-card"
              }`}
            >
              <span className="text-sm">{m.achieved ? "✅" : "🔒"}</span>
              <div>
                <p className="text-xs font-semibold text-content">{m.days} {t("days")}</p>
                <p className="text-[10px] text-content-muted">
                  {m.reward === "streak_freeze" ? "🧊 +1 Freeze"
                    : m.reward === "streak_freeze_x2" ? "🧊 +2 Freezes"
                    : m.reward === "badge" ? "🏅 Badge"
                    : "🏆 Legend"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
