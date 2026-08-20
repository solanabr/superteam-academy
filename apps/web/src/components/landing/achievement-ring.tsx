"use client";

import type { DeployedAchievement } from "@/lib/content/queries";
import { AchievementPatch3D } from "@/components/gamification/achievement-patch-3d";

/**
 * The CTA section's rotating achievement ring (designer feedback, 19-08).
 *
 * A 3D carousel that spins continuously and pauses while hovered (or while
 * anything inside has focus), replacing the flat marquee that lived in its own
 * section: the achievements now sit between the CTA's promise and its buttons,
 * so the reward is on screen at the moment of decision.
 *
 * The badges are the spec's 3D patch — real thickness, six shade slices
 * between two identically-authored faces — so the ring's own orbit supplies
 * each patch's Y rotation and their corners show as they pass edge-on. Far-side
 * patches are the ones showing their back face, which is dimmed so the ring
 * reads as depth rather than a flat wall of badges.
 *
 * All motion is CSS (`.ach-ring*` in globals.css): items are placed with
 * per-item `--ring-a` angles around a shared `--ring-r` radius and the ring
 * animates one full turn. Names are flat text, so each carries a pre-rotated
 * back copy — otherwise the far half would render mirrored.
 * `prefers-reduced-motion` stops the spin and leaves a static arc.
 */
export function AchievementRing({
  achievements,
}: {
  achievements: DeployedAchievement[];
}) {
  const step = 360 / achievements.length;

  return (
    <div className="ach-ring-stage" role="list">
      <div className="ach-ring">
        {achievements.map((ach, i) => (
          <div
            key={ach.id}
            role="listitem"
            className="ach-ring-item"
            style={{ "--ring-a": `${i * step}deg` } as React.CSSProperties}
          >
            <AchievementPatch3D
              id={ach.id}
              glyph={ach.glyph}
              solTier={ach.solTier}
              category={ach.category}
            />
            <div className="ach-ring-label">
              <p className="ach-ring-name">{ach.name}</p>
              <p
                className="ach-ring-name ach-ring-name--back"
                aria-hidden="true"
              >
                {ach.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
