"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import {
  Footprints,
  GraduationCap,
  Lightning,
  Fire,
  CalendarCheck,
  Crown,
  Code,
  Anchor,
  Stack,
  HandHeart,
  ChatCircle,
  Star,
  RocketLaunch,
  Bug,
  Crosshair,
} from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, ComponentType<IconProps>> = {
  "first-steps": Footprints,
  "course-completer": GraduationCap,
  "speed-runner": Lightning,
  "week-warrior": Fire,
  "monthly-master": CalendarCheck,
  "consistency-king": Crown,
  "rust-rookie": Code,
  "anchor-expert": Anchor,
  "full-stack-solana": Stack,
  helper: HandHeart,
  "first-comment": ChatCircle,
  "top-contributor": Star,
  "early-adopter": RocketLaunch,
  "bug-hunter": Bug,
  "perfect-score": Crosshair,
};

interface AchievementCardProps {
  id: string;
  name: string;
  description: string;
  unlockedAt?: Date;
  className?: string;
}

export function AchievementCard({
  id,
  name,
  description,
  unlockedAt,
  className,
}: AchievementCardProps) {
  const t = useTranslations("gamification");
  const isUnlocked = !!unlockedAt;
  const Icon = ICON_MAP[id] ?? Star;

  return (
    <div className={cn("w-[100px] text-center", className)}>
      <div
        className={cn(
          "mx-auto mb-2 flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] transition-transform duration-200 hover:scale-[1.08]",
          isUnlocked
            ? "border-accent bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] text-accent-dark shadow-[0_4px_0_0_var(--accent-dark),0_0_16px_rgba(245,158,11,0.15)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.35),0_0_16px_rgba(251,191,36,0.15)]"
            : "border-border bg-subtle text-text-3 opacity-40"
        )}
      >
        <Icon size={28} weight="bold" aria-hidden="true" />
      </div>
      <p
        className={cn(
          "font-display text-[11px] font-bold leading-tight",
          isUnlocked ? "text-text-2" : "text-text-3"
        )}
      >
        {name}
      </p>
      <p className="mt-0.5 font-body text-[10px] leading-tight text-text-3">
        {description}
      </p>
      {!isUnlocked && (
        <p className="mt-0.5 font-display text-[10px] font-bold text-text-3">
          {t("locked")}
        </p>
      )}
    </div>
  );
}
