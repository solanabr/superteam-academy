"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";
import { LevelBadge } from "./level-badge";
import { cn } from "@/lib/utils";

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

export function LevelUpOverlay() {
  const t = useTranslations("gamification");
  const [level, setLevel] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleLevelUp = useCallback((e: Event) => {
    const { newLevel } = (e as CustomEvent<LevelUpEvent>).detail;
    setLevel(newLevel);
    setVisible(true);
    setAnimating(true);

    // Fire confetti from both sides
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ["#0D9488", "#F59E0B", "#312E81", "#5EEAD4"],
    });
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ["#0D9488", "#F59E0B", "#312E81", "#5EEAD4"],
    });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setAnimating(false);
      setTimeout(() => setVisible(false), 500);
    }, 3000);
  }, []);

  useEffect(() => {
    window.addEventListener("superteam:level-up", handleLevelUp);
    return () =>
      window.removeEventListener("superteam:level-up", handleLevelUp);
  }, [handleLevelUp]);

  if (!visible || level === null) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500",
        animating ? "opacity-100" : "opacity-0"
      )}
      aria-live="assertive"
    >
      {/* Backdrop */}
      <div className="bg-bg/60 absolute inset-0 backdrop-blur-sm" />

      {/* Content */}
      <div
        className={cn(
          "relative flex flex-col items-center gap-4 transition-all duration-700",
          animating ? "translate-y-0 scale-100" : "translate-y-8 scale-75"
        )}
      >
        {/* Animated ring */}
        <div className="relative">
          <div className="absolute -inset-4 animate-ping rounded-full bg-primary opacity-20" />
          <div className="absolute -inset-8 rounded-full bg-primary opacity-10 blur-xl" />
          <LevelBadge level={level} size="lg" />
        </div>

        <div className="text-center">
          <h2 className="font-display text-3xl font-black text-primary">
            {t("levelUp")}
          </h2>
          <p className="mt-1 font-body text-lg text-text-3">
            {t("levelUpMessage", { level })}
          </p>
        </div>
      </div>
    </div>
  );
}
