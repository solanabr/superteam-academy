"use client";

import { useState, useRef } from "react";
import { useWallet } from "@/lib/wallet/context";
import { useProgram } from "@/lib/hooks/use-program";
import { useEnrollment } from "@/lib/hooks/use-enrollment";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
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
  const { requireAuth } = useRequireAuth();
  const {
    enrollment,
    exists: isEnrolled,
    loading: enrollmentLoading,
    refresh: refreshEnrollment,
  } = useEnrollment(courseId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Optimistic: show enrolled state immediately after TX confirms
  const [optimisticEnrolled, setOptimisticEnrolled] = useState(false);
  const enrollingRef = useRef(false);

  const isComplete = isEnrolled && enrollment?.completedAt !== null;

  const handleEnroll = async () => {
    if (!program || !publicKey || enrollingRef.current) return;
    enrollingRef.current = true;
    setLoading(true);
    setError(null);
    setOptimisticEnrolled(false);
    try {
      await enroll(program, publicKey, courseId);
      analytics.courseEnrolled(courseId);
      // TX confirmed on-chain — show success immediately
      setOptimisticEnrolled(true);
      setLoading(false);
      // Background: sync actual on-chain state (non-blocking)
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const found = await refreshEnrollment();
        if (found) {
          setOptimisticEnrolled(false); // real state took over
          break;
        }
      }
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
      setLoading(false);
    } finally {
      enrollingRef.current = false;
    }
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
        <button
          className="sa-enroll-btn"
          onClick={() => requireAuth(() => handleEnroll())}
          disabled={loading}
        >
          {loading ? tl("enrolling") : t.enrollNow}
        </button>
        {metaText}
      </div>
    );
  }

  // Only show "enrolling" spinner on initial load, not during handleEnroll
  if (enrollmentLoading && !loading && !optimisticEnrolled && !error) {
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

  if (isEnrolled || optimisticEnrolled) {
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
            marginTop: "8px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
