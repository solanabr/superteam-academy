"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { XpData } from "@/types";

interface XPBarProps {
  xpData: XpData;
  showLabel?: boolean;
  className?: string;
}

export function XPBar({ xpData, showLabel = true, className }: XPBarProps) {
  const t = useTranslations("xpBar");
  const { level, balance, xpToNextLevel, xpProgress } = xpData;

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-accent font-semibold">
            {t("level", { level })}
          </span>
          <span className="text-muted-foreground">
            {balance.toLocaleString()} XP · {xpToNextLevel.toLocaleString()}{" "}
            {t("toNext")}
          </span>
        </div>
      )}
      <div className="h-1 w-full rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, xpProgress * 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
