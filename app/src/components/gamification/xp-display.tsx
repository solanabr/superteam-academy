"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calculateLevel,
  levelProgress,
  xpToNextLevel,
  xpForLevel,
} from "@/lib/constants";

interface XPDisplayProps {
  xp: number;
  compact?: boolean;
}

export function XPDisplay({ xp, compact }: XPDisplayProps) {
  const t = useTranslations("xpDisplay");
  const level = calculateLevel(xp);
  const progress = levelProgress(xp);
  const toNext = xpToNextLevel(xp);
  const nextLevelXP = xpForLevel(level + 1);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  }, [xp]);

  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Current Experience Points"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)]",
          animate && "animate-pop",
        )}
      >
        <Zap className="w-3.5 h-3.5 text-[#00FFA3] fill-[#00FFA3]" />
        <span
          className={cn(
            "font-mono text-sm font-semibold",
            animate ? "text-[#00FFA3]" : "text-[var(--c-text)]",
          )}
        >
          {xp.toLocaleString()}
        </span>
      </div>
    );
  }

  const levelTitleKeys: Record<number, string> = {
    0: "levelNewcomer",
    1: "levelExplorer",
    2: "levelBuilder",
    3: "levelDeveloper",
    4: "levelArchitect",
    5: "levelSpecialist",
    6: "levelExpert",
    7: "levelMaster",
    8: "levelLegend",
    9: "levelGrandmaster",
  };
  const levelTitleKey =
    levelTitleKeys[Math.min(level, 9)] ?? "levelGrandmaster";
  const levelTitle = t(levelTitleKey);

  return (
    <div
      className="w-full flex flex-col gap-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--c-text-2)]">{t("yourProgress")}</p>
          <h2 className="text-2xl font-bold text-[var(--c-text)]">
            {t("levelTitle", { level })}
            <span className="ml-2 text-sm font-normal text-[var(--c-text-2)]">
              · {levelTitle}
            </span>
          </h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-[#00FFA3]">
            {xp.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--c-text-2)]">
            / {nextLevelXP.toLocaleString()} XP
          </p>
        </div>
      </div>

      {/* XP Progress bar with gradient and glow */}
      <div
        className="relative h-3 rounded-[1px] bg-[var(--c-border-subtle)] overflow-hidden"
        role="progressbar"
        aria-valuenow={xp}
        aria-valuemin={0}
        aria-valuemax={nextLevelXP}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-[1px] bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-[1px] bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] blur-sm opacity-50"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-[var(--c-text-2)]">
        {t("xpToNextLevel", { xp: toNext.toLocaleString(), level: level + 1 })}
      </p>
    </div>
  );
}
