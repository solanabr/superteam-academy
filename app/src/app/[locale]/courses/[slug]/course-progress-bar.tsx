"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEnrollment, countCompletedLessons } from "@/lib/hooks/use-enrollment";
import { courses } from "@/lib/services/courses";

interface CourseProgressBarProps {
  courseId: string;
}

export function CourseProgressBar({ courseId }: CourseProgressBarProps) {
  const { connected } = useWallet();
  const { enrollment, exists, loading } = useEnrollment(courseId);

  if (!connected || loading || !exists || !enrollment) return null;

  const course = courses.find((c) => c.id === courseId);
  const total = course?.lessonCount ?? 0;
  const completed = countCompletedLessons(enrollment.lessonFlags);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (pct <= 0) return null;

  return (
    <div
      className="v9-fade-up"
      style={{
        padding: "0 clamp(20px, 8vw, 120px)",
        background: "var(--v9-white)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: "var(--v9-mid-grey)",
          }}
        >
          YOUR PROGRESS
        </span>
        <span
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: "12px",
            fontWeight: 600,
            color: pct >= 100 ? "var(--v9-sol-green)" : "var(--v9-dark)",
          }}
        >
          {pct}%
        </span>
        <span
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: "10px",
            color: "var(--v9-mid-grey)",
          }}
        >
          {completed}/{total} lessons
        </span>
      </div>
      <div
        style={{
          height: "4px",
          width: "100%",
          background: "rgba(26,25,24,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: "100%",
            width: `${pct}%`,
            background:
              pct >= 100
                ? "var(--v9-sol-green)"
                : "linear-gradient(90deg, var(--v9-sol-green), var(--v9-accent))",
            transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  );
}
