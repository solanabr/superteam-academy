"use client";

import { cn } from "@/lib/utils";
import { resolvePatchLook } from "@/components/gamification/patch-look";

/**
 * The achievement patch (spec: achievement-patches v1, 20-08).
 *
 * Replaces the metallic octagon medal: flat fill, ink outline, dashed stitch,
 * hard offset shadow — the same construction as the buttons. Shape carries the
 * tier, colour carries the category, the glyph names the achievement. All
 * visuals live in `.patch` (globals.css) and are driven by the data attributes
 * this component emits; no per-achievement CSS exists.
 */
export type PatchSize = 28 | 40 | 56 | 72 | 104;
export type PatchState = "earned" | "locked";

export function AchievementPatch({
  id,
  glyph,
  solTier,
  category,
  state,
  size = 72,
  className,
}: {
  /** Content _id (e.g. "achievement-first-steps") — selects tier + category. */
  id: string;
  glyph: string;
  solTier?: boolean;
  category?: string;
  state: PatchState;
  size?: PatchSize;
  className?: string;
}) {
  const look = resolvePatchLook(id, glyph, solTier, category);

  return (
    <span
      className={cn("patch", className)}
      data-size={size}
      data-tier={look.tier}
      data-cat={look.cat}
      data-glyph={look.symbol ? "symbol" : "text"}
      data-locked={state === "locked" || undefined}
      aria-hidden="true"
    >
      <span>{look.glyph}</span>
    </span>
  );
}
