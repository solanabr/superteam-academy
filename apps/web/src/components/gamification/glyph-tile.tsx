"use client";

import { PatchGlyph } from "@/components/gamification/patch-glyph";
import { cn } from "@/lib/utils";

/**
 * The TILE tier of the glyph language (owner-approved 21-08) — the quietest of
 * the three: a 24px rounded square washed with the type colour at 12%, the
 * glyph in that colour at full strength, no ink outline and no shadow.
 *
 * This replaced a bare-glyph "mark" (no container at all). The mark was
 * theoretically the right step down, but at the activity feed's real density
 * the rows lost their anchor and read sparse, so the tier keeps the lightest
 * container that still gives each row something to sit against.
 */
export type TileTint = "primary" | "gold" | "purple" | "sky" | "streak";

export function GlyphTile({
  glyph,
  tint,
  className,
}: {
  glyph: string;
  tint: TileTint;
  className?: string;
}) {
  return (
    <span className={cn("tile", className)} data-tint={tint} aria-hidden="true">
      <PatchGlyph glyph={glyph} />
    </span>
  );
}
