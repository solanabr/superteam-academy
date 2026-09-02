"use client";

import { useEffect, useMemo, useState } from "react";
import type { DeployedAchievement } from "@/lib/content/queries";
import { AchievementPatch3D } from "@/components/gamification/achievement-patch-3d";

/**
 * How many of the catalog's achievements ride the ring at once.
 *
 * The ring is a fixed-radius circle, so the count IS the spacing: every extra
 * badge divides the same circumference further. At the full catalog the arc
 * per item fell below the width of a single label and the badges — and worse,
 * their names — ran into each other. This many leaves a clear gap between
 * neighbours at every breakpoint, and the ring reads as a sample of the set
 * rather than an inventory of it.
 */
const RING_SLOTS = 9;

/** Draw `n` distinct items at random. Does not touch the input. */
function sample<T>(items: readonly T[], n: number): T[] {
  const pool = [...items];
  const drawn: T[] = [];
  while (drawn.length < n && pool.length > 0) {
    const [picked] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    if (picked !== undefined) drawn.push(picked);
  }
  return drawn;
}

/**
 * The CTA section's rotating achievement ring (designer feedback, 19-08).
 *
 * A 3D carousel that spins continuously and pauses while hovered (or while
 * anything inside has focus), replacing the flat marquee that lived in its own
 * section: the achievements now sit between the CTA's promise and its buttons,
 * so the reward is on screen at the moment of decision.
 *
 * It shows a RANDOM sample rather than the whole catalog — see `RING_SLOTS`.
 * The draw happens on mount, not during render: the server and the first
 * client pass both render the same leading slice, so hydration matches, and
 * the shuffle lands on the next paint while the ring is still turning into
 * view.
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
  const [shown, setShown] = useState<DeployedAchievement[]>(() =>
    achievements.slice(0, RING_SLOTS)
  );

  // Identity, not reference: the parent may hand us a fresh array on any
  // re-render, and re-drawing the sample then would make the ring flicker.
  const catalogKey = useMemo(
    () => achievements.map((a) => a.id).join(","),
    [achievements]
  );

  useEffect(() => {
    setShown(sample(achievements, RING_SLOTS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogKey]);

  const step = 360 / shown.length;

  return (
    <div className="ach-ring-stage" role="list">
      <div className="ach-ring">
        {shown.map((ach, i) => (
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
