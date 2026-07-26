"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { celebrate } from "@/lib/gamification/celebration";
import { cn } from "@/lib/utils";

/**
 * Level-up popup — the popup-only medium moment (LX-B11 acceptance line:
 * "confetti fires only at deploy + credential mint; level-up gets a medium
 * moment"). The animated pop-spring card IS the moment — the level-up tier
 * resolves to "popup" in the celebration module, so celebrate("level-up")
 * fires no confetti (early level-ups arrive every few lessons; confetti that
 * frequent would recreate the routine-reward pattern PED-10 warns about).
 * Reuses the v9 .popup-grad pattern shared with achievement/certificate popups.
 */

interface LevelUpEvent {
  level: number;
  uid: number;
}

let counter = 0;

export function dispatchLevelUp(level: number): void {
  if (typeof window === "undefined") return;
  counter++;
  window.dispatchEvent(
    new CustomEvent("superteam:level-up", {
      detail: { level, uid: counter },
    })
  );
}

export function LevelUpPopup({ className }: { className?: string }) {
  const t = useTranslations("gamification");

  const [events, setEvents] = useState<LevelUpEvent[]>([]);

  const handleLevelUp = useCallback((e: Event) => {
    const detail = (e as CustomEvent<LevelUpEvent>).detail;
    setEvents((prev) => [...prev, detail]);
    // Routed through the tier module for uniformity; resolves to the "popup"
    // tier, which is guaranteed confetti-free (asserted in celebration.test.ts).
    celebrate("level-up");
    setTimeout(() => {
      setEvents((prev) => prev.filter((ev) => ev.uid !== detail.uid));
    }, 7000);
  }, []);

  useEffect(() => {
    window.addEventListener("superteam:level-up", handleLevelUp);
    return () =>
      window.removeEventListener("superteam:level-up", handleLevelUp);
  }, [handleLevelUp]);

  if (events.length === 0) return null;

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      aria-live="polite"
      aria-label={t("levelUp")}
    >
      {events.map((ev) => (
        /* v9 .popup-grad — Solana gradient border, pop-spring animation */
        <div key={ev.uid} className="popup-grad achievement">
          <div className="popup-grad-inner">
            {/* v9 .popup-icon-ring — 44px circle, Solana gradient, 2.5px padding */}
            <div className="popup-icon-ring">
              <div className="popup-icon-inner" aria-hidden="true">
                ↑
              </div>
            </div>
            <div>
              {/* v9 .popup-label — mono 10px uppercase primary */}
              <div className="popup-label">{t("levelUp")}</div>
              {/* v9 .popup-name — Nunito 800, 15px */}
              <div className="popup-name">
                {t("levelUpMessage", { level: ev.level })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
