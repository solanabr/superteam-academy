"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AchievementEvent {
  id: string;
  name: string;
  uid: number;
}

let counter = 0;

export function dispatchAchievementUnlock(id: string, name: string): void {
  if (typeof window === "undefined") return;
  counter++;
  window.dispatchEvent(
    new CustomEvent("superteam:achievement-unlock", {
      detail: { id, name, uid: counter },
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
    }, 4000);
  }, []);

  useEffect(() => {
    window.addEventListener("superteam:achievement-unlock", handleUnlock);
    return () =>
      window.removeEventListener("superteam:achievement-unlock", handleUnlock);
  }, [handleUnlock]);

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
        <button
          key={ev.uid}
          onClick={() => handleClick(ev.uid)}
          className="flex animate-pop items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-push transition-opacity hover:opacity-90"
        >
          <span className="font-display text-xs font-bold text-primary-foreground">
            {t("newAchievement")}
          </span>
          <span className="font-body text-xs text-primary-foreground/80">
            {ev.name}
          </span>
          <span className="font-body text-xs font-medium text-primary-foreground underline">
            {t("viewAchievements")}
          </span>
        </button>
      ))}
    </div>
  );
}
