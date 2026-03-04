"use client";

import type { AchievementState } from "@/hooks/useAchievements";

interface AchievementBadgeProps {
  state: AchievementState;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { container: 40, emoji: "1rem", title: "0.6rem" },
  md: { container: 56, emoji: "1.4rem", title: "0.65rem" },
  lg: { container: 72, emoji: "1.75rem", title: "0.7rem" },
};

/**
 * Single achievement badge — earned badges have full-color glow,
 * unearned are grayscale with a lock overlay.
 */
export function AchievementBadge({
  state,
  size = "md",
}: AchievementBadgeProps) {
  const { achievement, earned } = state;
  const s = SIZES[size];

  return (
    <div
      title={`${achievement.title}: ${achievement.description}${earned ? " ✓" : " (locked)"}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.375rem",
        width: s.container + 24,
      }}
    >
      <div
        style={{
          width: s.container,
          height: s.container,
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: s.emoji,
          position: "relative",
          flexShrink: 0,
          background: earned
            ? "linear-gradient(135deg, rgba(153,69,255,0.2), rgba(25,251,155,0.1))"
            : "var(--bg-elevated)",
          border: `1px solid ${earned ? "rgba(153,69,255,0.4)" : "var(--border-subtle)"}`,
          boxShadow: earned
            ? "0 0 12px rgba(153,69,255,0.2)"
            : "none",
          filter: earned ? "none" : "grayscale(1) opacity(0.35)",
          transition: "all 0.2s ease",
        }}
        aria-label={`${achievement.title}: ${earned ? "earned" : "not yet earned"}`}
      >
        {achievement.emoji}
        {!earned && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.55rem",
            }}
          >
            🔒
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: s.title,
          color: earned ? "var(--text-secondary)" : "var(--text-muted)",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: s.container + 20,
        }}
      >
        {achievement.title}
      </span>
    </div>
  );
}

/** Grid of all achievements with earned/locked state */
export function AchievementGrid({
  states,
}: {
  states: AchievementState[];
}) {
  const categories = [
    { key: "progress", label: "Progress" },
    { key: "skill", label: "Skills & XP" },
    { key: "streak", label: "Streaks" },
    { key: "special", label: "Special" },
  ] as const;

  return (
    <div className="space-y-6">
      {categories.map(({ key, label }) => {
        const group = states.filter(
          (s) => s.achievement.category === key,
        );
        if (group.length === 0) return null;
        return (
          <div key={key}>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              {group.map((s) => (
                <AchievementBadge
                  key={s.achievement.id}
                  state={s}
                  size="md"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
