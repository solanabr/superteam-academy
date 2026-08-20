"use client";

import type { Icon } from "@phosphor-icons/react";
import {
  Bug,
  Crown,
  Flame,
  Footprints,
  GraduationCap,
  Sparkle,
  Trophy,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * The octagonal achievement medal, with a per-achievement engraving.
 *
 * Brand guide §07: achievements are octagonal medals — amber metal when
 * earned, the Solana gradient for the flagship tier, a ghost face when locked
 * — and their glyphs are JetBrains Mono, never emoji. What the plain-glyph
 * medal lacked was identity: every badge was the same coin with different
 * text. This adds the layer the designers asked for — each achievement's
 * Phosphor icon (the guide's one interface icon set; no bespoke set) stamped
 * into the metal above the canonical mono glyph, like a minted coin: dark
 * fill, hairline top-light, no new colors.
 *
 * The engraving is keyed on the achievement doc's `icon` name. An icon
 * without an entry falls back to the glyph-only face, so newly authored
 * achievements degrade to exactly the pre-engraving medal instead of a hole.
 */
const ENGRAVINGS: Record<string, Icon> = {
  bug: Bug,
  crown: Crown,
  flame: Flame,
  footprints: Footprints,
  "graduation-cap": GraduationCap,
  sparkles: Sparkle,
  trophy: Trophy,
};

export type MedalState = "earned" | "sol" | "locked";

export function AchievementMedal({
  glyph,
  icon,
  state,
  className,
}: {
  glyph: string;
  icon?: string;
  state: MedalState;
  className?: string;
}) {
  const Engraving = icon ? ENGRAVINGS[icon] : undefined;

  return (
    <div className={cn("ach-medal", state, className)} aria-hidden="true">
      <div className="ach-face" />
      {Engraving ? (
        <span className="ach-stamp">
          <Engraving weight="fill" className="ach-stamp-icon" />
          <span className="ach-glyph">{glyph}</span>
        </span>
      ) : (
        <span className="ach-glyph">{glyph}</span>
      )}
    </div>
  );
}
