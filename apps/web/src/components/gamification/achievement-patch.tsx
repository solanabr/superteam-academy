"use client";

import { cn } from "@/lib/utils";

/**
 * The achievement patch (spec: achievement-patches v1, 20-08).
 *
 * Replaces the metallic octagon medal: flat fill, ink outline, dashed stitch,
 * hard offset shadow — the same construction as the buttons. Shape carries the
 * tier, colour carries the category, the glyph names the achievement. All
 * visuals live in `.patch` (globals.css) and are driven by the data attributes
 * this component emits; no per-achievement CSS exists.
 */
type PatchTier = 1 | 2 | 3 | 4;
type PatchCategory =
  | "reward"
  | "start"
  | "course"
  | "craft"
  | "community"
  | "endurance"
  | "onchain";
export type PatchSize = 28 | 40 | 56 | 72 | 104;
export type PatchState = "earned" | "locked";

interface PatchLook {
  tier: PatchTier;
  cat: PatchCategory;
  /** Overrides the content glyph where the spec renamed it (✦→★, ※→!). */
  glyph?: string;
}

/**
 * Spec assignments for the curated catalog, keyed by content _id. Tier comes
 * from what the learner did and category from the six brand buckets — neither
 * is derivable from the content doc alone, so the known set is pinned here and
 * anything the spec hasn't named falls back via its content category below.
 */
const PATCH_LOOKS: Record<string, PatchLook> = {
  "achievement-first-steps": { tier: 1, cat: "reward" },
  "achievement-early-adopter": { tier: 1, cat: "start" },
  "achievement-rust-rookie": { tier: 1, cat: "start" },
  "achievement-course-completer": { tier: 2, cat: "course", glyph: "★" },
  "achievement-bug-hunter": { tier: 2, cat: "community", glyph: "!" },
  "achievement-monthly-master": { tier: 2, cat: "reward" },
  "achievement-week-warrior": { tier: 2, cat: "reward" },
  "achievement-anchor-expert": { tier: 3, cat: "craft" },
  "achievement-consistency-king": { tier: 3, cat: "endurance" },
  "achievement-full-stack-solana": { tier: 4, cat: "onchain" },
};

/** Content category → patch bucket for achievements the spec hasn't named. */
const CATEGORY_FALLBACK: Record<string, PatchLook> = {
  progress: { tier: 2, cat: "course" },
  streaks: { tier: 2, cat: "reward" },
  special: { tier: 2, cat: "community" },
};

function resolveLook(
  id: string,
  solTier: boolean | undefined,
  category: string | undefined
): PatchLook {
  const known = PATCH_LOOKS[id];
  if (known) return known;
  // An unmapped on-chain-minted achievement is by definition tier 4.
  if (solTier) return { tier: 4, cat: "onchain" };
  return CATEGORY_FALLBACK[category ?? ""] ?? { tier: 2, cat: "course" };
}

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
  const look = resolveLook(id, solTier, category);
  const shown = look.glyph ?? glyph;
  // Single-char symbol glyphs (✩ ★ ⬡ ◎ ∞) come from a fallback font and sit
  // ~7% low in their em box — CSS nudges them up. Digits/letters do not.
  const symbol = shown.length === 1 && shown.charCodeAt(0) > 127;

  return (
    <span
      className={cn("patch", className)}
      data-size={size}
      data-tier={look.tier}
      data-cat={look.cat}
      data-glyph={symbol ? "symbol" : "text"}
      data-locked={state === "locked" || undefined}
      aria-hidden="true"
    >
      <span>{shown}</span>
    </span>
  );
}
