"use client";

import type { DeployedAchievement } from "@/lib/content/queries";
import { AchievementMedal } from "@/components/gamification/achievement-medal";

/**
 * The CTA section's rotating achievement ring (designer feedback, 19-08).
 *
 * A 3D carousel that spins continuously and pauses while hovered (or while
 * anything inside has focus), replacing the flat marquee that lived in its own
 * section: the achievements now sit between the CTA's promise and its buttons,
 * so the reward is on screen at the moment of decision.
 *
 * All motion is CSS (`.ach-ring*` in globals.css): items are placed with
 * per-item `--ring-a` angles around a shared `--ring-r` radius, the ring
 * animates one full turn, and `backface-visibility: hidden` culls the far half
 * so labels never render mirrored. `prefers-reduced-motion` stops the spin and
 * leaves a static arc.
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
            <AchievementMedal
              glyph={ach.glyph}
              icon={ach.icon}
              state={ach.solTier ? "sol" : "earned"}
            />
            <p className="ach-ring-name">{ach.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
