"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/contexts/locale-context";

interface DifficultyBadgeProps {
  difficulty: 1 | 2 | 3;
}

const COLORS: Record<number, string> = {
  1: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  2: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  3: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const KEYS: Record<number, string> = {
  1: "courses.filterBeginner",
  2: "courses.filterIntermediate",
  3: "courses.filterAdvanced",
};

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const { t } = useLocale();
  return (
    <Badge variant="outline" className={COLORS[difficulty]}>
      {t(KEYS[difficulty])}
    </Badge>
  );
}
