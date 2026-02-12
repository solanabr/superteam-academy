import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
  difficulty: "beginner" | "intermediate" | "advanced";
  label: string;
  className?: string;
}

const difficultyStyles = {
  beginner: "border-primary/40 bg-card text-primary-dark dark:text-primary",
  intermediate:
    "border-secondary-light/40 bg-card text-secondary dark:text-secondary-light",
  advanced: "border-streak/40 bg-card text-[#9A3412] dark:text-streak",
} as const;

/** Shared base class for all card-overlay chip badges (difficulty, enrolled, completed). */
export const chipBase =
  "inline-flex items-center rounded-full border bg-card px-3 py-0.5 text-[11px] font-display font-bold uppercase tracking-wider";

export function DifficultyBadge({
  difficulty,
  label,
  className,
}: DifficultyBadgeProps) {
  return (
    <span className={cn(chipBase, difficultyStyles[difficulty], className)}>
      {label}
    </span>
  );
}
