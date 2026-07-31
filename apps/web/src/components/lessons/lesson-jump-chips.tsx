"use client";

import { ChatCircle, Lightbulb, Tag } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type JumpChipKind = "topics" | "hints" | "discussion";

export interface JumpChip {
  kind: JumpChipKind;
  label: string;
  /** Trailing count, LeetCode's "Discussion (12)" affordance. */
  count?: string | null;
  /** Anchor id of the section this chip opens and scrolls to. */
  targetId: string;
  onActivate: () => void;
}

const ICONS: Record<JumpChipKind, typeof Tag> = {
  topics: Tag,
  hints: Lightbulb,
  discussion: ChatCircle,
};

interface LessonJumpChipsProps {
  chips: JumpChip[];
  className?: string;
}

/**
 * LeetCode's Topics/Hints chip row, rendered under the lesson h1. Each chip
 * opens its disclosure section and scrolls it into view — the sections stay
 * the single source of the content, these are shortcuts to them.
 *
 * `aria-controls` points at the section's anchor id so the relationship is
 * announced; the chips are plain buttons (not links) because activating one
 * changes disclosure state as well as scroll position.
 */
export function LessonJumpChips({ chips, className }: LessonJumpChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => {
        const Icon = ICONS[chip.kind];
        return (
          <button
            key={chip.kind}
            type="button"
            onClick={chip.onActivate}
            aria-controls={chip.targetId}
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
