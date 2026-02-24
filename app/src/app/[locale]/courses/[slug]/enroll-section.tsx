"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/hooks/use-program";
import { useEnrollment } from "@/lib/hooks/use-enrollment";
import { enroll } from "@/lib/solana/transactions";
import { analytics } from "@/providers/analytics-provider";

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
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("PrerequisiteNotMet")) {
        setError("You must complete the prerequisite course first.");
      } else if (msg.includes("custom program error")) {
        setError("Enrollment failed. Check prerequisites.");
      } else {
        setError("Enrollment failed. Please try again.");
      }
    }
    setLoading(false);
  };

  const metaText = (
    <span
      className="text-sm"
      style={{ fontFamily: "var(--v9-sans)", color: "var(--v9-mid-grey)" }}
    >
      {totalCompletions > 0 &&
        `${totalCompletions.toLocaleString()} ${t.completions} \u00B7 `}
      {t.by}{" "}
      <strong style={{ color: "var(--v9-dark)", fontWeight: 500 }}>
        {creator}
      </strong>
    </span>
  );

  if (!connected) {
    return (
      <div className="v9-enroll-section">
        <button className="v9-enroll-btn" disabled>
          {t.enrollNow}
        </button>
        <span
          className="text-sm"
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: "var(--v9-mid-grey)",
          }}
        >
          Connect wallet to enroll
        </span>
      </div>
    );
  }

  if (enrollmentLoading) {
    return (
      <div className="v9-enroll-section">
        <span
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: "var(--v9-mid-grey)",
          }}
        >
          Loading...
        </span>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="v9-enroll-section">
        <button className="v9-enroll-btn completed">
          &#10003;&nbsp;&nbsp;{t.completed}
        </button>
        {metaText}
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="v9-enroll-section">
        <button className="v9-enroll-btn enrolled">
          &#10003;&nbsp;&nbsp;{t.enrolled}
        </button>
        {metaText}
      </div>
    );
  }

  return (
    <div className="v9-enroll-section">
      <button
        className="v9-enroll-btn"
        onClick={handleEnroll}
        disabled={loading}
      >
        {loading ? "Enrolling..." : t.enrollNow}
      </button>
      {metaText}
      {error && (
        <p
          style={{
            fontFamily: "var(--v9-mono)",
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
