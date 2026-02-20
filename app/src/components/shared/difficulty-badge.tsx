import { cn } from "@/lib/utils";
import { difficultyLabels } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface DifficultyBadgeProps {
  difficulty: 1 | 2 | 3;
  className?: string;
}

const difficultyColors: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  2: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  3: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-900",
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium border",
        difficultyColors[difficulty],
        className
      )}
    >
      {difficultyLabels[difficulty]}
    </Badge>
  );
}
