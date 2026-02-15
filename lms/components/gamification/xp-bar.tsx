"use client";

import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { useXP, useLevel } from "@/lib/hooks/use-service";
import { getXpProgress, formatXP } from "@/lib/utils";

export function XPBar() {
  const { data: xp = 0 } = useXP();
  const { data: level = 0 } = useLevel();
  const t = useTranslations("gamification");
  const progress = getXpProgress(xp);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-xp-gold/10">
          <Zap className="h-4 w-4 text-xp-gold" />
        </div>
        <span className="text-sm font-bold text-xp-gold">{formatXP(xp)}</span>
      </div>
      <div className="flex-1 max-w-32">
        <Progress value={progress.percent} className="h-1.5" indicatorClassName="bg-xp-gold" />
      </div>
      <span className="text-xs text-muted-foreground">{t("lvl", { level })}</span>
    </div>
  );
}
