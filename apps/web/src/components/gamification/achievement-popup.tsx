"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AchievementEvent {
  id: string;
  name: string;
  uid: number;
  xpReward: number;
}

let counter = 0;

export function dispatchAchievementUnlock(id: string, name: string): void {
  if (typeof window === "undefined") return;
  counter++;
  window.dispatchEvent(
    new CustomEvent("superteam:achievement-unlock", {
      detail: { id, name, uid: counter, xpReward: 0 },
    })
  );
}

/** Enrich an already-displayed achievement popup with its XP reward amount. */
export function dispatchAchievementXp(
  achievementId: string,
  amount: number
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("superteam:achievement-xp", {
      detail: { achievementId, amount },
    })
  );
}

export function AchievementPopup({ className }: { className?: string }) {
  const t = useTranslations("gamification");
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

  const [events, setEvents] = useState<AchievementEvent[]>([]);

  const handleUnlock = useCallback((e: Event) => {
    const detail = (e as CustomEvent<AchievementEvent>).detail;
    setEvents((prev) => [...prev, detail]);
    setTimeout(() => {
      setEvents((prev) => prev.filter((ev) => ev.uid !== detail.uid));
    }, 7000);
  }, []);

  // Enrich an existing popup with its XP amount (arrives from xp_transactions INSERT)
  const handleXpEnrich = useCallback((e: Event) => {
    const { achievementId, amount } = (
      e as CustomEvent<{ achievementId: string; amount: number }>
    ).detail;
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === achievementId ? { ...ev, xpReward: amount } : ev
      )
    );
  }, []);

  useEffect(() => {
    window.addEventListener("superteam:achievement-unlock", handleUnlock);
    window.addEventListener("superteam:achievement-xp", handleXpEnrich);
    return () => {
      window.removeEventListener("superteam:achievement-unlock", handleUnlock);
      window.removeEventListener("superteam:achievement-xp", handleXpEnrich);
    };
  }, [handleUnlock, handleXpEnrich]);

  if (events.length === 0) return null;

  function handleClick(uid: number) {
    setEvents((prev) => prev.filter((ev) => ev.uid !== uid));
    router.push(`/${locale}/profile#achievements`);
  }

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      aria-live="polite"
      aria-label={t("achievements")}
    >
      {events.map((ev) => (
        /* v9 .popup-grad.achievement — Solana gradient border, pop-spring animation */
        <button
          key={ev.uid}
          onClick={() => handleClick(ev.uid)}
          className="popup-grad achievement cursor-pointer border-none bg-transparent p-0 text-left transition-opacity hover:opacity-90"
          aria-label={`${t("newAchievement")}: ${ev.name}`}
        >
          <div className="popup-grad-inner">
            {/* v9 .popup-icon-ring — 44px circle, Solana gradient, 2.5px padding */}
            <div className="popup-icon-ring">
              <div className="popup-icon-inner" aria-hidden="true">
                🏆
              </div>
            </div>
            <div className="flex-1">
              {/* v9 .popup-label — mono 10px uppercase primary */}
              <div className="popup-label">{t("newAchievement")}</div>
              {/* v9 .popup-name — Nunito 800, 15px */}
              <div className="popup-name">{ev.name}</div>
            </div>
            {ev.xpReward > 0 && (
              <div className="popup-xp ml-2 !animate-none">
                <span className="popup-xp-amount">+{ev.xpReward} XP</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
