import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
  difficulty: "beginner" | "intermediate" | "advanced";
  label: string;
  className?: string;
}

/**
 * v9 difficulty chip styles — pill-beg / pill-int / pill-adv pattern.
 * Uses CSS var() for backgrounds not yet mapped in Tailwind config.
 */
const difficultyStyles = {
  beginner:
    "[border-color:var(--primary-border)] [background:var(--primary-dim)] text-primary-dark dark:text-primary",
  intermediate:
    "[border-color:var(--accent-border)] bg-xp-dim text-xp-dark dark:text-xp",
  advanced:
    "[border-color:var(--streak-border)] bg-streak-light text-streak dark:[background:var(--streak-dim)]",
} as const;

/** Shared base class for all card-overlay chip badges (difficulty, enrolled, completed). */
export const chipBase =
  "inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-display font-bold uppercase tracking-wider";

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
