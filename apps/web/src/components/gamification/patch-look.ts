/**
 * Tier + category assignment for achievement patches (spec: achievement-patches
 * v1). Shape is the tier, colour is the category — neither is derivable from
 * the content doc, which only carries a loose category like "streaks", so the
 * curated set is pinned here and anything unnamed falls back below.
 *
 * Shared by the flat patch and the 3D patch so the two can never disagree
 * about an achievement's shape or colour.
 */
export type PatchTier = 1 | 2 | 3 | 4;

export type PatchCategory =
  | "reward"
  | "start"
  | "course"
  | "craft"
  | "community"
  | "endurance"
  | "onchain";

interface PatchLook {
  tier: PatchTier;
  cat: PatchCategory;
  /** Overrides the content glyph where the spec renamed it (✦→★, ※→!). */
  glyph?: string;
}

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

export interface ResolvedPatchLook {
  tier: PatchTier;
  cat: PatchCategory;
  /** The glyph to render — the spec's override where one exists. */
  glyph: string;
  /**
   * Single-char symbol glyphs (✩ ★ ⬡ ◎ ∞) come from a fallback font and sit
   * ~7% low in their em box, so they get an optical nudge. Digits and letter
   * pairs do not.
   */
  symbol: boolean;
}

export function resolvePatchLook(
  id: string,
  glyph: string,
  solTier: boolean | undefined,
  category: string | undefined
): ResolvedPatchLook {
  const fallback: PatchLook = solTier
    ? // An unmapped on-chain-minted achievement is by definition tier 4.
      { tier: 4, cat: "onchain" }
    : (CATEGORY_FALLBACK[category ?? ""] ?? { tier: 2, cat: "course" });

  const look = PATCH_LOOKS[id] ?? fallback;

  const shown = look.glyph ?? glyph;
  return {
    tier: look.tier,
    cat: look.cat,
    glyph: shown,
    symbol: shown.length === 1 && shown.charCodeAt(0) > 127,
  };
}
