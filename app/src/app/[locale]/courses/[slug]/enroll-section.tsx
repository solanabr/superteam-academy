"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/hooks/use-program";
import { useEnrollment } from "@/lib/hooks/use-enrollment";
import { enroll } from "@/lib/solana/transactions";
import { analytics } from "@/providers/analytics-provider";
import { parseAnchorError } from "@/lib/solana/anchor-errors";
import { useTranslations } from "next-intl";

interface EnrollSectionProps {
  courseId: string;
  totalCompletions: number;
  creator: string;
  t: {
    enrollNow: string;
    completions: string;
    by: string;
    enrolled: string;
    completed: string;
  };
}

export function EnrollSection({
  courseId,
  totalCompletions,
  creator,
  t,
}: EnrollSectionProps) {
  const tl = useTranslations("lesson");
  const { publicKey, connected } = useWallet();
  const program = useProgram();
  const {
    enrollment,
    exists: isEnrolled,
    loading: enrollmentLoading,
    refresh: refreshEnrollment,
  } = useEnrollment(courseId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete = isEnrolled && enrollment?.completedAt !== null;

  const handleEnroll = async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    setError(null);
    try {
      await enroll(program, publicKey, courseId);
      analytics.courseEnrolled(courseId);
      await refreshEnrollment();
    } catch (e: unknown) {
      console.error("Enroll failed:", e);
      const anchor = parseAnchorError(e);
      if (anchor) {
        switch (anchor.name) {
          case "PrerequisiteNotMet":
            setError(tl("prerequisiteNotMet"));
            break;
          case "CourseNotActive":
          case "CourseIdEmpty":
          case "CourseIdTooLong":
            setError(tl("enrollmentFailedPrereq"));
            break;
          default:
            setError(anchor.message || tl("enrollmentFailed"));
        }
      } else {
        setError(tl("enrollmentFailed"));
      }
    }
    setLoading(false);
  };

  const metaText = (
    <span
      className="text-sm"
      style={{ fontFamily: "var(--font-sans)", color: "var(--c-text-muted)" }}
    >
      {totalCompletions > 0 &&
        `${totalCompletions.toLocaleString()} ${t.completions} \u00B7 `}
      {t.by}{" "}
      <strong style={{ color: "var(--foreground)", fontWeight: 500 }}>
        {creator}
      </strong>
    </span>
  );

  if (!connected) {
    return (
      <div className="sa-enroll-section">
        <button className="sa-enroll-btn" disabled>
          {t.enrollNow}
        </button>
        <span
          className="text-sm"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: "var(--c-text-muted)",
          }}
        >
          {tl("connectToEnroll")}
        </span>
      </div>
    );
  }

  if (enrollmentLoading) {
    return (
      <div className="sa-enroll-section">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: "var(--c-text-muted)",
          }}
        >
          {tl("enrolling")}
        </span>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="sa-enroll-section">
        <button className="sa-enroll-btn completed">
          &#10003;&nbsp;&nbsp;{t.completed}
        </button>
        {metaText}
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="sa-enroll-section">
        <button className="sa-enroll-btn enrolled">
          &#10003;&nbsp;&nbsp;{t.enrolled}
        </button>
        {metaText}
      </div>
    );
  }

  return (
    <div className="sa-enroll-section">
      <button
        className="sa-enroll-btn"
        onClick={handleEnroll}
        disabled={loading}
      >
        {loading ? tl("enrolling") : t.enrollNow}
      </button>
      {metaText}
      {error && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#EF4444",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
