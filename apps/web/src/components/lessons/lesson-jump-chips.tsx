"use client";

import { useTranslations } from "next-intl";
import {
  ChatCircle,
  Gauge,
  Lightbulb,
  Tag,
  UsersThree,
} from "@phosphor-icons/react";
import { BUILDERS_COMPLETED_FLOOR } from "@/lib/lessons/builders-completed";
import { cn } from "@/lib/utils";
import { difficultyStyles } from "@/components/course/difficulty-badge";

export type JumpChipKind = "topics" | "hints" | "discussion";

export interface JumpChip {
  kind: JumpChipKind;
  label: string;
  /** Trailing count, LeetCode's "Discussion (12)" affordance. */
  count?: string | null;
  /** Anchor id of the section this chip scrolls to. */
  targetId: string;
  /** Id of that section's disclosure PANEL — what the chip actually controls. */
  panelId: string;
  /** Whether that section is currently open. */
  expanded: boolean;
  onActivate: () => void;
}

const ICONS: Record<JumpChipKind, typeof Tag> = {
  topics: Tag,
  hints: Lightbulb,
  discussion: ChatCircle,
};

type DifficultyTier = keyof typeof difficultyStyles;

function isDifficultyTier(value: string): value is DifficultyTier {
  return value in difficultyStyles;
}

interface LessonJumpChipsProps {
  chips: JumpChip[];
  /**
   * Course-level difficulty (#942 PR B) — rendered as a leading, non-interactive
   * chip colored per tier (the course card's palette). Anything outside the
   * known tiers (or null/undefined) renders nothing: difficulty is authored
   * content, and an unknown value must not crash the header.
   */
  difficulty?: string | null;
  /**
   * How many builders completed this lesson (#942 PR B), server-fetched. The
   * chip renders only at or above {@link BUILDERS_COMPLETED_FLOOR} — a tiny
   * count is worse social proof than none.
   */
  buildersCompleted?: number;
  className?: string;
}

/**
 * LeetCode's Topics/Hints chip row, rendered under the lesson h1. Each chip
 * opens its disclosure section and scrolls it into view — the sections stay
 * the single source of the content, these are shortcuts to them.
 *
 * A chip is a second control for its section's disclosure, so it carries the
 * same `aria-expanded` + `aria-controls` pair as the section header and points
 * at the same always-rendered panel id. They are plain buttons (not links)
 * because activating one changes disclosure state as well as scroll position.
 *
 * The row also carries two static (non-interactive) chips: the course
 * difficulty and the builders-completed count. Those are `span`s, not buttons —
 * they control nothing and jump nowhere.
 */
export function LessonJumpChips({
  chips,
  difficulty,
  buildersCompleted = 0,
  className,
}: LessonJumpChipsProps) {
  const tCourses = useTranslations("courses");
  const tLesson = useTranslations("lesson");

  const tier =
    typeof difficulty === "string" && isDifficultyTier(difficulty)
      ? difficulty
      : null;
  const showBuilders = buildersCompleted >= BUILDERS_COMPLETED_FLOOR;

  if (chips.length === 0 && !tier && !showBuilders) return null;

  const staticChipBase =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-bold";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {tier && (
        <span className={cn(staticChipBase, difficultyStyles[tier])}>
          <Gauge size={13} weight="duotone" aria-hidden="true" />
          {tCourses(tier)}
        </span>
      )}
      {showBuilders && (
        <span
          className={cn(staticChipBase, "border-border bg-subtle text-text-2")}
        >
          <UsersThree size={13} weight="duotone" aria-hidden="true" />
          {tLesson("buildersCompleted", { count: buildersCompleted })}
        </span>
      )}
      {chips.map((chip) => {
        const Icon = ICONS[chip.kind];
        return (
          <button
            key={chip.kind}
            type="button"
            onClick={chip.onActivate}
            aria-expanded={chip.expanded}
            aria-controls={chip.panelId}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-subtle px-3 py-1 font-display text-xs font-bold text-text-2 transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            <Icon size={13} weight="duotone" aria-hidden="true" />
            {chip.label}
            {chip.count ? (
              <span className="font-mono font-normal tabular-nums text-text-3">
                ({chip.count})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
