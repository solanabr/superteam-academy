"use client";

import { cn } from "@/lib/utils";
import { resolvePatchLook } from "@/components/gamification/patch-look";
import { PatchGlyph } from "@/components/gamification/patch-glyph";

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
/**
 * The edge band, expressed as fractions of the slab's own thickness.
 *
 * Slices are zero-thickness planes, so their spacing is what decides whether
 * the rim reads as a solid edge or as a comb; thirteen of them across the
 * thickness closes the gaps.
 *
 * They are FRACTIONS, not pixels, because the faces sit at `±var(--t)/2` and
 * the thickness is a CSS variable that changes per breakpoint. Absolute
 * offsets drifted the moment `--t` shrank on mobile: the outermost slices
 * ended up in FRONT of the faces, and since a slice is a solid fill inset
 * only 1px, it covered the face entirely — the badges rendered as blank
 * coloured blobs with no glyph and no stitch. A fraction cannot drift: the
 * outermost lands at 6/7 of the half-thickness, always inside the faces.
 */
const SLICE_COUNT = 13;
const HALF = (SLICE_COUNT - 1) / 2;
const SLICES = Array.from(
  { length: SLICE_COUNT },
  (_, i) => (i - HALF) / (HALF + 1)
);

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
  const look = resolvePatchLook(id, glyph, solTier, category);

  const face = (
    <>
      <span className="patch3d__stitch" aria-hidden="true" />
      <span className="patch3d__glyph">
        <PatchGlyph glyph={look.glyph} />
      </span>
    </>
  );

  return (
    <div
      className={cn("patch3d", className)}
      data-tier={look.tier}
      data-cat={look.cat}
      aria-hidden="true"
    >
      {SLICES.map((f) => (
        <div
          key={f}
          className="patch3d__slice"
          style={{ transform: `translateZ(calc(var(--t) / 2 * ${f}))` }}
        />
      ))}
      {/* Rim panels. The slices run parallel to the faces, so edge-on they
          have no projected width at all and the patch thins to nothing as it
          passes 90°. These two planes sit perpendicular to them along the left
          and right edges, which is exactly where a real slab shows its
          thickness — so the middle stays filled right through the turn. */}
      <div className="patch3d__rim patch3d__rim--l" />
      <div className="patch3d__rim patch3d__rim--r" />
      <div className="patch3d__face patch3d__face--back">{face}</div>
      <div className="patch3d__face patch3d__face--front">{face}</div>
    </div>
  );
}
