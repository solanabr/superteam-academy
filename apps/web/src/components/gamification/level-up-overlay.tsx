"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { LevelBadge } from "./level-badge";
import { cn } from "@/lib/utils";

/**
 * V9 Design System: Level-up popup was removed in v8.
 * Level-up is communicated as a non-blocking toast notification
 * (not a blocking modal/overlay). The dashboard stat strip updating
 * is the primary indicator of a level change.
 */

interface LevelUpEvent {
  newLevel: number;
}

export function dispatchLevelUp(newLevel: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("superteam:level-up", {
      detail: { newLevel },
    })
  );
}

export function LevelUpOverlay({ className }: { className?: string }) {
  const t = useTranslations("gamification");
  const [events, setEvents] = useState<{ level: number; uid: number }[]>([]);

  const handleLevelUp = useCallback((e: Event) => {
    const { newLevel } = (e as CustomEvent<LevelUpEvent>).detail;
    const uid = Date.now();
    setEvents((prev) => [...prev, { level: newLevel, uid }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setEvents((prev) => prev.filter((ev) => ev.uid !== uid));
    }, 4000);
  }, []);

  useEffect(() => {
    window.addEventListener("superteam:level-up", handleLevelUp);
    return () =>
      window.removeEventListener("superteam:level-up", handleLevelUp);
  }, [handleLevelUp]);

  if (events.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)} aria-live="polite">
      {events.map((ev) => (
        <div
          key={ev.uid}
          className={cn(
            "inline-flex items-center gap-3",
            "rounded-[var(--r-full)] border border-[var(--border)] bg-[var(--card)] px-5 py-3",
            "shadow-[var(--shadow),0_0_24px_var(--level-dim)]"
          )}
          style={{
            animation: "pop-spring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <LevelBadge level={ev.level} size="sm" />
          <div>
            <div className="font-mono text-[10px] font-medium uppercase tracking-[1px] text-[var(--level)]">
              {t("levelUp")}
            </div>
            <div className="font-display text-[15px] font-extrabold text-[var(--text)]">
              {t("levelUpMessage", { level: ev.level })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
