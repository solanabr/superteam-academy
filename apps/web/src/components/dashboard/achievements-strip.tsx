"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useDragScroll } from "@/hooks/use-drag-scroll";
import { AchievementToken } from "@/components/gamification/dashboard-identity-panel";
import type { AchievementDefinition } from "@/lib/gamification";

interface AchievementsStripProps {
  achievementsCount: number;
  unlockedAchievementIds: string[];
  catalog: AchievementDefinition[];
}

/**
 * Achievements as a slim main-column strip under the identity panel (04-08):
 * earned tokens first, then the next couple of locked ones as a pull. No
 * sentences — the kicker and the count chip are the entire copy.
 */
export function AchievementsStrip({
  achievementsCount,
  unlockedAchievementIds,
  catalog,
}: AchievementsStripProps) {
  const t = useTranslations("gamification");
  const unlockedSet = useMemo(
    () => new Set(unlockedAchievementIds),
    [unlockedAchievementIds]
  );
  // Full catalog, earned first — the row scrolls horizontally when tight.
  const shown = useMemo(() => {
    const earned = catalog.filter((a) => unlockedSet.has(a.id));
    const locked = catalog.filter((a) => !unlockedSet.has(a.id));
    return [...earned, ...locked];
  }, [catalog, unlockedSet]);

  // Grab-and-drag scrolling for the token row (05-08).
  const {
    ref: rowRef,
    wasDrag,
    dragHandlers,
  } = useDragScroll<HTMLDivElement>();

  // Tap-to-show tooltip state (mobile touch support).
  const [openTip, setOpenTip] = useState<string | null>(null);
  useEffect(() => {
    if (!openTip) return;
    const timer = setTimeout(() => setOpenTip(null), 3000);
    return () => clearTimeout(timer);
  }, [openTip]);

  if (catalog.length === 0) return null;

  return (
    <section aria-label={t("yourAchievements")}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-black tracking-[-0.25px]">
          {t("yourAchievements")}
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[1px] text-text-3">
          {t("ofUnlocked", {
            count: achievementsCount,
            total: catalog.length,
          })}
        </span>
      </div>
      <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-card">
        <Tooltip.Provider delayDuration={0} skipDelayDuration={150}>
          <div className="ach-strip-row" ref={rowRef} {...dragHandlers}>
            {shown.map((ach) => {
              const earned = unlockedSet.has(ach.id);
              const isSol = earned && ach.solTier;
              const tipId = `achstrip-${ach.id}`;
              return (
                <AchievementToken
                  key={ach.id}
                  id={ach.id}
                  glyph={ach.glyph}
                  category={ach.category}
                  solTier={ach.solTier}
                  name={ach.name}
                  hint={ach.description}
                  state={earned ? (isSol ? "sol" : "earned") : "locked"}
                  label={t("achievementTokenLabel", {
                    name: ach.name,
                    state: earned ? (isSol ? "sol" : "earned") : "locked",
                  })}
                  isOpen={openTip === tipId}
                  onTap={() =>
                    setOpenTip((prev) => (prev === tipId ? null : tipId))
                  }
                  onOpenChange={(open) => setOpenTip(open ? tipId : null)}
                  wasDrag={wasDrag}
                />
              );
            })}
          </div>
        </Tooltip.Provider>
      </div>
    </section>
  );
}
