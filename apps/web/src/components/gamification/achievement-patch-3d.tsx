"use client";

import { cn } from "@/lib/utils";
import { resolvePatchLook } from "@/components/gamification/patch-look";

/**
 * The 3D achievement patch (spec: achievement-patches v1, "The 3D patch").
 *
 * The same flat art given thickness: six slices in the category's shade colour
 * stacked between a front and a back face. No lighting, no bevel, no specular —
 * it should read as a printed patch turning over, not a metal coin.
 *
 * Both faces are authored identically. The back face's own `rotateY(180deg)`
 * cancels the container's rotation at the moment it faces the viewer, so its
 * art reads upright and unmirrored; adding a counter-mirror is the classic
 * mistake and reverses the glyph.
 *
 * This renders the spinning body only — no `perspective` of its own — so it can
 * sit inside a parent that already owns the 3D scene (the CTA ring). Shape and
 * colour come from the same `data-tier` / `data-cat` attributes as the flat
 * patch, so the two can never drift apart.
 */
const SLICES = [-5, -3, -1, 1, 3, 5]; // every 2px through --t: 14px

export function AchievementPatch3D({
  id,
  glyph,
  solTier,
  category,
  className,
}: {
  /** Content _id (e.g. "achievement-first-steps") — selects tier + category. */
  id: string;
  glyph: string;
  solTier?: boolean;
  category?: string;
  className?: string;
}) {
  const {
    tier,
    cat,
    glyph: shown,
    symbol,
  } = resolvePatchLook(id, glyph, solTier, category);

  const face = (
    <>
      <span className="patch3d__stitch" aria-hidden="true" />
      <span
        className={
          symbol ? "patch3d__glyph patch3d__glyph--symbol" : "patch3d__glyph"
        }
      >
        {shown}
      </span>
    </>
  );

  return (
    <div
      className={cn("patch3d", className)}
      data-tier={tier}
      data-cat={cat}
      aria-hidden="true"
    >
      {SLICES.map((z) => (
        <div
          key={z}
          className="patch3d__slice"
          style={{ transform: `translateZ(${z}px)` }}
        />
      ))}
      <div className="patch3d__face patch3d__face--back">{face}</div>
      <div className="patch3d__face patch3d__face--front">{face}</div>
    </div>
  );
}
