"use client";

import { cn } from "@/lib/utils";
import { PatchGlyph } from "@/components/gamification/patch-glyph";
import type { PatchCategory } from "@/components/gamification/patch-look";

/**
 * The CHIP tier of the glyph language (owner-approved 21-08).
 *
 * The achievement patch's construction sized down for repeated dashboard rows:
 * same category fill, same ink outline, same hard offset shadow, same glyph
 * rendering — but no dashed stitch, because presence has to step down where the
 * mark repeats. The patch stays reserved for achievements.
 *
 * Colour comes from the patch's own `data-cat` map (`.chip` reuses those
 * custom properties verbatim in globals.css), so a chip can never drift from
 * the patch it descends from.
 */
export type ChipSize = 24 | 28 | 34 | 40 | 48;

export function GlyphChip({
  glyph,
  cat,
  size = 34,
  round = false,
  empty = false,
  className,
}: {
  glyph: string;
  /** Ignored when `empty` — an empty state has no category to colour. */
  cat?: PatchCategory;
  size?: ChipSize;
  /** Circular instead of the default squared chip. */
  round?: boolean;
  /**
   * The empty-state variant: dashed outline, no fill, muted glyph — the same
   * treatment the patch already uses for a not-yet-earned achievement, because
   * "nothing here yet" is the same statement (owner, 21-08). It shares the
   * locked patch's declaration block in globals.css rather than restating its
   * values, so the two can never drift.
   */
  empty?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("chip", className)}
      data-size={size}
      data-cat={empty ? undefined : cat}
      data-round={round || undefined}
      data-empty={empty || undefined}
      aria-hidden="true"
    >
      <PatchGlyph glyph={glyph} />
    </span>
  );
}
