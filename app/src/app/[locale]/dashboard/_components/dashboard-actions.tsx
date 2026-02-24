"use client";

import React from "react";
import { Reveal } from "./dashboard-primitives";
import { G, D, C, M, BORDER } from "./dashboard-primitives";

export const DashboardActions: React.FC<{
  resumeTarget: { slug: string; lessonId: string } | null;
  onResume: () => void;
  onViewCerts: () => void;
}> = ({ resumeTarget, onResume, onViewCerts }) => (
  <Reveal delay={650}>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}
    >
      <button
        data-magnetic
        onClick={onResume}
        disabled={!resumeTarget}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          padding: "18px 16px",
          background: resumeTarget ? C : "var(--overlay-divider)",
          color: resumeTarget ? D : M,
          border: "none",
          cursor: resumeTarget ? "pointer" : "default",
          transition: "all 0.3s",
          opacity: resumeTarget ? 1 : 0.5,
        }}
        onMouseEnter={(e) => {
          if (resumeTarget) {
            (e.target as HTMLButtonElement).style.background = G;
          }
        }}
        onMouseLeave={(e) => {
          if (resumeTarget) {
            (e.target as HTMLButtonElement).style.background = C;
          }
        }}
      >
        {resumeTarget ? "RESUME →" : "NO COURSE"}
      </button>
      <button
        data-magnetic
        onClick={onViewCerts}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2,
          padding: "18px 16px",
          background: "transparent",
          color: C,
          border: `1px solid ${BORDER}`,
          cursor: "pointer",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.borderColor =
            "var(--c-text-faint)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.borderColor = BORDER;
        }}
      >
        VIEW CERTS
      </button>
    </div>
  </Reveal>
);
