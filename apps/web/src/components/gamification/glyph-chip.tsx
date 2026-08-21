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
export type ChipSize = 28 | 34 | 40;

export function GlyphChip({
  glyph,
  cat,
  size = 34,
  round = false,
  className,
}: {
  glyph: string;
  cat: PatchCategory;
  size?: ChipSize;
  /** Circular instead of the default squared chip. */
  round?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("chip", className)}
      data-size={size}
      data-cat={cat}
      data-round={round || undefined}
      aria-hidden="true"
    >
      <PatchGlyph glyph={glyph} />
    </span>
  );
}
