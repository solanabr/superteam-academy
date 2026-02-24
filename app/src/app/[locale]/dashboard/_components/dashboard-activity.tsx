"use client";

import React from "react";
import { Reveal, AnimCounter } from "./dashboard-primitives";
import { D, C, M, BORDER } from "./dashboard-primitives";

export const DashboardStatsGrid: React.FC<{
  xp: number;
  completedCount: number;
  totalCourses: number;
  streakDays: number;
  level: number;
  mobile: boolean;
}> = ({ xp, completedCount, totalCourses, streakDays, level, mobile }) => (
  <Reveal delay={100}>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 1,
        background: BORDER,
        marginBottom: 32,
      }}
    >
      {[
        { v: xp, u: "XP", l: "EXPERIENCE" },
        { v: completedCount, u: `/${totalCourses}`, l: "COURSES" },
        { v: streakDays, u: "d", l: "STREAK" },
        { v: level, u: "", l: "LEVEL" },
      ].map((s, i) => (
        <div key={i} style={{ background: D, padding: "20px 16px" }}>
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 30,
              color: C,
            }}
          >
            <AnimCounter to={s.v} />
            <span style={{ fontSize: 13, color: M }}>{s.u}</span>
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 9,
              letterSpacing: 2,
              color: M,
              marginTop: 4,
            }}
          >
            {s.l}
          </div>
        </div>
      ))}
    </div>
  </Reveal>
);

export const DashboardStatsList: React.FC<{
  level: number;
  enrolledCount: number;
  completedCount: number;
  credentialCount: number;
}> = ({ level, enrolledCount, completedCount, credentialCount }) => (
  <Reveal delay={500}>
    <p
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 10,
        letterSpacing: 2,
        color: M,
        margin: "0 0 12px",
      }}
    >
      YOUR STATS
    </p>
    <div style={{ border: `1px solid ${BORDER}` }}>
      {[
        { label: "LEVEL", value: `${level}` },
        { label: "ENROLLED", value: `${enrolledCount} courses` },
        { label: "COMPLETED", value: `${completedCount} courses` },
        { label: "CREDENTIALS", value: `${credentialCount}` },
      ].map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: i < 3 ? `1px solid ${BORDER}` : "none",
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              color: M,
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: C,
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </Reveal>
);
