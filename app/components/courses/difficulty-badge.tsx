import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/data/types";

const config: Record<Difficulty, { label: string; dot: string; text: string }> = {
  1: {
    label: "Beginner",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  2: {
    label: "Intermediate",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  3: {
    label: "Advanced",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  const { label, dot, text } = config[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        text,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
