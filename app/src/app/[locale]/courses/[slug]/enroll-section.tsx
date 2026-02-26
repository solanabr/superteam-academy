"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/lib/wallet/context";
import { useProgram } from "@/lib/hooks/use-program";
import {
  useEnrollment,
  countCompletedLessons,
  isLessonComplete,
} from "@/lib/hooks/use-enrollment";
import { learningService } from "@/lib/services/learning-progress";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
import { enroll } from "@/lib/solana/transactions";
import { analytics } from "@/providers/analytics-provider";
import { parseAnchorError } from "@/lib/solana/anchor-errors";
import { useTranslations } from "next-intl";

interface EnrollSectionProps {
  courseId: string;
  slug: string;
  totalLessons: number;
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
  slug,
  totalLessons,
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
  const [finalizing, setFinalizing] = useState(false);
  // Optimistic: show enrolled state immediately after TX confirms
  const [optimisticEnrolled, setOptimisticEnrolled] = useState(false);
  const enrollingRef = useRef(false);

  const isComplete = isEnrolled && enrollment?.completedAt !== null;

  // Detect "all lessons done but never finalized" state
  const completedCount = enrollment?.lessonFlags
    ? countCompletedLessons(enrollment.lessonFlags)
    : 0;

  // Also check local progress for lessons completed locally but not yet on-chain
  const [locallyComplete, setLocallyComplete] = useState(false);
  useEffect(() => {
    if (!isEnrolled || isComplete || !publicKey || totalLessons === 0) return;
    if (completedCount >= totalLessons) return;

    learningService
      .getProgress(publicKey.toBase58(), courseId)
      .then((progress) => {
        if (progress.completedLessons.length >= totalLessons) {
          setLocallyComplete(true);
        }
      });
  }, [isEnrolled, isComplete, publicKey, courseId, completedCount, totalLessons]);

  const allLessonsDone =
    isEnrolled && !isComplete && totalLessons > 0 && (completedCount >= totalLessons || locallyComplete);

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

  const handleFinalize = async () => {
    if (!publicKey || finalizing) return;
    setFinalizing(true);
    setError(null);
    try {
      const walletAddress = publicKey.toBase58();

      // Sync locally-completed lessons that are missing on-chain
      if (enrollment?.lessonFlags && completedCount < totalLessons) {
        const progress = await learningService.getProgress(walletAddress, courseId);
        const missingIndices: number[] = [];
        for (const idx of progress.completedLessons) {
          if (!isLessonComplete(enrollment.lessonFlags, idx)) {
            missingIndices.push(idx);
          }
        }
        if (missingIndices.length > 0) {
          const results = await Promise.allSettled(
            missingIndices.map((lessonIndex) =>
              fetch("/api/complete-lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ learner: walletAddress, courseId, lessonIndex }),
              })
            )
          );
          const anyFailed = results.some(
            (r) => r.status === "rejected" || !(r.value as Response).ok
          );
          if (anyFailed) {
            setError(tl("syncFailed"));
            return;
          }
          // Wait for on-chain confirmation
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      const res = await fetch(`/api/courses/${slug}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        // Poll for completedAt to appear on-chain
        for (let i = 0; i < 8; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const updated = await refreshEnrollment();
          if (updated?.completedAt != null) break;
        }
      }
    } catch (e) {
      console.error("Finalize failed:", e);
      setError(tl("finalizeFailed"));
    } finally {
      setFinalizing(false);
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

  if (allLessonsDone) {
    return (
      <div className="sa-enroll-section">
        <button
          className="sa-enroll-btn"
          onClick={() => requireAuth(handleFinalize)}
          disabled={finalizing}
        >
          {finalizing ? tl("finalizing") : tl("finalizeAndClaim")}
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
