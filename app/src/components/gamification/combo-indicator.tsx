"use client";

import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGamification } from "@/lib/hooks/use-gamification";

export function ComboIndicator() {
  const t = useTranslations("gamification");
  const { combo } = useGamification();

  const label = (() => {
    if (combo.count >= 5) return t("combo.super");
    if (combo.count >= 3) return t("combo.count", { count: combo.count });
    if (combo.count >= 2) return t("combo.twoX");
    return null;
  })();
  if (!label || combo.count < 2) return null;

  return (
    <div className="flex items-center gap-1 rounded-full bg-brazil-gold/10 px-2 py-0.5 text-xs font-semibold text-brazil-gold animate-combo-pulse">
      <Flame className="h-3 w-3" />
      {label}
    </div>
  );
}
