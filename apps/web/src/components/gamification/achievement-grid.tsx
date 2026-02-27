"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CaretDown,
  Check,
  CheckSquare,
  Square,
  Trophy,
} from "@phosphor-icons/react";
import type { Achievement } from "@superteam-lms/types";
import { AchievementCard } from "./achievement-card";
import type { AchievementDefinition } from "@/lib/gamification";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AchievementGridProps {
  unlockedAchievements: Achievement[];
  /** Deployed achievement definitions fetched from Sanity — only these are shown. */
  catalog: AchievementDefinition[];
  className?: string;
}

export function AchievementGrid({
  unlockedAchievements,
  catalog,
  className,
}: AchievementGridProps) {
  const t = useTranslations("gamification");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showLocked, setShowLocked] = useState(false);

  const unlockedMap = new Map(
    unlockedAchievements.map((a) => [a.id, a.unlockedAt])
  );

  const explorerUrlMap = new Map(
    unlockedAchievements
      .filter((a) => a.explorerUrl)
      .map((a) => [a.id, a.explorerUrl!])
  );

  const assetAddressMap = new Map(
    unlockedAchievements
      .filter((a) => a.assetAddress)
      .map((a) => [a.id, a.assetAddress!])
  );

  // Derive categories from the live catalog (no hardcoded list)
  const categories = [
    "all",
    ...Array.from(new Set(catalog.map((a) => a.category))).sort(),
  ];

  const filtered =
    activeCategory === "all"
      ? catalog
      : catalog.filter((a) => a.category === activeCategory);

  const visible = showLocked
    ? filtered
    : filtered.filter((a) => unlockedMap.has(a.id));

  const sorted = [...visible].sort((a, b) => {
    const aUnlocked = unlockedMap.has(a.id);
    const bUnlocked = unlockedMap.has(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  const totalUnlocked = unlockedAchievements.filter((a) =>
    catalog.some((c) => c.id === a.id)
  ).length;
  const totalAchievements = catalog.length;

  const categoryLabel =
    activeCategory === "all"
      ? t("all")
      : t(`category_${activeCategory}` as Parameters<typeof t>[0]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="font-display text-lg font-black">{t("achievements")}</h3>
        <span className="inline-flex items-center rounded-full border border-border bg-[var(--input)] px-2 py-0.5 font-mono text-[11px] font-semibold text-text-2">
          {totalUnlocked}
          <span className="mx-0.5 text-text-3">/</span>
          {totalAchievements}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Category dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-full border-[2.5px] border-border bg-card px-3 py-1 font-display text-xs font-bold text-text shadow-[0_2px_0_0_var(--border)] transition-all duration-150 hover:border-border-hover">
              {categoryLabel}
              <CaretDown size={12} weight="bold" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {categories.map((cat) => (
              <DropdownMenuItem
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex items-center gap-2 font-body text-xs"
              >
                <Check
                  size={14}
                  weight="bold"
                  className={cn(
                    activeCategory === cat ? "text-primary" : "invisible"
                  )}
                  aria-hidden="true"
                />
                {cat === "all"
                  ? t("all")
                  : t(`category_${cat}` as Parameters<typeof t>[0])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Show locked checkbox */}
        <button
          role="checkbox"
          aria-checked={showLocked}
          onClick={() => setShowLocked((prev) => !prev)}
          className="flex items-center gap-1.5 font-body text-xs font-medium text-text-2 transition-colors hover:text-text"
        >
          {showLocked ? (
            <CheckSquare
              size={16}
              weight="fill"
              className="text-primary"
              aria-hidden="true"
            />
          ) : (
            <Square size={16} weight="bold" aria-hidden="true" />
          )}
          {t("showLocked")}
        </button>
      </div>

      {/* Badge wall */}
      {sorted.length > 0 ? (
        <div className="ach-grid">
          {sorted.map((def) => (
            <AchievementCard
              key={def.id}
              name={def.name}
              description={def.description}
              glyph={def.glyph}
              solTier={def.solTier}
              unlockedAt={unlockedMap.get(def.id)}
              explorerUrl={explorerUrlMap.get(def.id)}
              assetAddress={assetAddressMap.get(def.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Trophy
            size={48}
            weight="duotone"
            className="text-accent"
            aria-hidden="true"
          />
          <p className="text-center font-body text-text-3">
            {t("noAchievements")}
          </p>
        </div>
      )}
    </div>
  );
}
