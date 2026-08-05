"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lightning } from "@phosphor-icons/react";
import { getAllAchievements } from "@/lib/content/client-queries";
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

interface TokenInfo {
  glyph: string;
  name: string;
  solTier: boolean;
}

export function AchievementPopup({ className }: { className?: string }) {
  const t = useTranslations("gamification");
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

  const [events, setEvents] = useState<AchievementEvent[]>([]);

  // Content catalog by id — the popup renders the achievement's REAL octagon
  // token (glyph + tier), and the content name beats the id-derived fallback
  // the Realtime handler sends. Fetched lazily on the first unlock; a failed
  // fetch just leaves the fallback name and a starter glyph.
  const [catalog, setCatalog] = useState<Map<string, TokenInfo> | null>(null);
  const catalogRequested = useRef(false);
  useEffect(() => {
    if (events.length === 0 || catalogRequested.current) return;
    catalogRequested.current = true;
    getAllAchievements()
      .then((all) => {
        setCatalog(
          new Map(
            all.map((a) => [
              a.id,
              { glyph: a.glyph, name: a.name, solTier: a.solTier },
            ])
          )
        );
      })
      .catch(() => {
        // Fallback path renders without content data.
      });
  }, [events.length]);

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
      {events.map((ev) => {
        const info = catalog?.get(ev.id);
        return (
          /* Rework 05-08: house card, gold accent — the icon is the earned
             dm-oct token itself, the same one lighting up on the dashboard. */
          <button
            key={ev.uid}
            onClick={() => handleClick(ev.uid)}
            className="rw-card gold cursor-pointer text-left transition-opacity hover:opacity-90"
            aria-label={`${t("newAchievement")}: ${info?.name ?? ev.name}`}
          >
            <div className="rw-oct" aria-hidden="true">
              <div className={cn("dm-oct", info?.solTier ? "sol" : "earned")}>
                <div className="dm-face" />
                <span className="dm-glyph">{info?.glyph ?? "★"}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="rw-kicker">{t("newAchievement")}</div>
              <div className="rw-name">{info?.name ?? ev.name}</div>
            </div>
            {ev.xpReward > 0 && (
              <div className="rw-xp">
                <Lightning size={12} weight="fill" aria-hidden="true" />+
                {ev.xpReward} {t("xp")}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
