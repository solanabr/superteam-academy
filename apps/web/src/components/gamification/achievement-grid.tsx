"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CaretDown, Check, CheckSquare, Square } from "@phosphor-icons/react";
import type { Achievement } from "@superteam-lms/types";
import { AchievementCard } from "./achievement-card";
import {
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_CATEGORIES,
  type AchievementCategory,
} from "@/lib/gamification";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AchievementGridProps {
  unlockedAchievements: Achievement[];
  className?: string;
}

export function AchievementGrid({
  unlockedAchievements,
  className,
}: AchievementGridProps) {
  const t = useTranslations("gamification");
  const [activeCategory, setActiveCategory] = useState<
    AchievementCategory | "all"
  >("all");
  const [showLocked, setShowLocked] = useState(false);

  const unlockedMap = new Map(
    unlockedAchievements.map((a) => [a.id, a.unlockedAt])
  );

  const filtered =
    activeCategory === "all"
      ? ACHIEVEMENT_CATALOG
      : ACHIEVEMENT_CATALOG.filter((a) => a.category === activeCategory);

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

  const totalUnlocked = unlockedAchievements.length;
  const totalAchievements = ACHIEVEMENT_CATALOG.length;

  const categoryLabel =
    activeCategory === "all" ? t("all") : t(`category_${activeCategory}`);

  const categories: (AchievementCategory | "all")[] = [
    "all",
    ...ACHIEVEMENT_CATEGORIES,
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{t("achievements")}</h3>
        <span className="font-body text-sm text-text-3">
          {totalUnlocked}/{totalAchievements}
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
                {cat === "all" ? t("all") : t(`category_${cat}`)}
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
      <div className="flex flex-wrap gap-5">
        {sorted.map((def) => (
          <AchievementCard
            key={def.id}
            id={def.id}
            name={def.name}
            description={def.description}
            unlockedAt={unlockedMap.get(def.id)}
          />
        ))}
      </div>
    </div>
  );
}
