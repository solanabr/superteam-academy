"use client";

import React, { useMemo } from "react";
import { Reveal } from "./dashboard-primitives";
import { G, C, M, BORDER } from "./dashboard-primitives";

const StreakHeatmap: React.FC<{
  activityHistory: Record<string, number>;
}> = ({ activityHistory }) => {
  const data = useMemo(() => {
    const maxXp = Math.max(
      1,
      ...Object.values(activityHistory).map((v) =>
        typeof v === "number" ? v : v ? 1 : 0,
      ),
    );
    return Array.from({ length: 84 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (83 - i));
      const key = date.toISOString().split("T")[0];
      const raw = activityHistory[key];
      const xp = typeof raw === "number" ? raw : raw ? 1 : 0;
      const level = xp === 0 ? 0 : Math.min(5, Math.ceil((xp / maxXp) * 5));
      return { xp, level };
    });
  }, [activityHistory]);

  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: 12 }).map((_, w) => (
        <div
          key={w}
          style={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          {Array.from({ length: 7 }).map((_, d) => {
            const { xp, level } = data[w * 7 + d] || { xp: 0, level: 0 };
            const baseOpacity = level === 0 ? 1 : 0.15 + level * 0.17;
            return (
              <div
                key={d}
                title={`${xp} XP earned`}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 2,
                  background: level > 0 ? G : "var(--overlay-divider)",
                  opacity: baseOpacity,
                  transition: "transform 0.2s, opacity 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLDivElement).style.transform = "scale(1.5)";
                  (e.target as HTMLDivElement).style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLDivElement).style.transform = "scale(1)";
                  (e.target as HTMLDivElement).style.opacity =
                    String(baseOpacity);
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const DashboardStreak: React.FC<{
  streakDays: number;
  activityHistory: Record<string, number>;
  mobile: boolean;
}> = ({ streakDays, activityHistory, mobile }) => (
  <Reveal delay={350}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 10,
          letterSpacing: 2,
          color: M,
          margin: 0,
        }}
      >
        LEARNING STREAK
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: G,
            animation: "stPulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            color: C,
          }}
        >
          {streakDays} DAYS
        </span>
      </div>
    </div>
    <div
      style={{
        padding: mobile ? 14 : 20,
        border: `1px solid ${BORDER}`,
        background: "var(--overlay-divider)",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <StreakHeatmap activityHistory={activityHistory} />
    </div>
  </Reveal>
);
