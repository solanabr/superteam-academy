"use client";

import { cn } from "@/lib/utils";
import { PatchGlyph } from "@/components/gamification/patch-glyph";

/**
 * The MARK tier of the glyph language (owner-approved 21-08) — the quietest
 * step: no container at all, just the glyph in a fixed 22px gutter with colour
 * carrying the type.
 *
 * Fixed width is the point. The activity feed's old bordered icon boxes made
 * every row's text start at a slightly different place depending on the icon
 * inside them (the owner's "first row looks smaller" report); a rigid gutter
 * cell removes that entirely.
 */
export type MarkTint = "primary" | "gold" | "purple" | "sky" | "streak";

export function GlyphMark({
  glyph,
  tint,
  className,
}: {
  glyph: string;
  tint: MarkTint;
  className?: string;
}) {
  return (
    <span className={cn("mark", className)} data-tint={tint} aria-hidden="true">
      <PatchGlyph glyph={glyph} />
    </span>
  );
}
