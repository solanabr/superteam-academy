"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const [optimisticComplete, setOptimisticComplete] = useState(false);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const enrollingRef = useRef(false);
  const finalizingRef = useRef(false);

  // Refs to avoid stale closures when requireAuth runs deferred actions
  // after wallet connect + auth (the stored callback would otherwise
  // capture program=null / publicKey=null from the pre-connect render)
  const programRef = useRef(program);
  programRef.current = program;
  const publicKeyRef = useRef(publicKey);
  publicKeyRef.current = publicKey;
  const enrollmentRef = useRef(enrollment);
  enrollmentRef.current = enrollment;

  const isComplete = isEnrolled && (enrollment?.completedAt !== null || optimisticComplete);

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

  const handleEnroll = useCallback(async () => {
    const currentProgram = programRef.current;
    const currentPublicKey = publicKeyRef.current;
    if (!currentProgram || !currentPublicKey || enrollingRef.current) return;
    enrollingRef.current = true;
    setLoading(true);
    setError(null);
    setOptimisticEnrolled(false);
    try {
      await enroll(currentProgram, currentPublicKey, courseId);
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
  }, [courseId, refreshEnrollment, tl]);

  const handleFinalize = useCallback(async () => {
    const currentPublicKey = publicKeyRef.current;
    const currentEnrollment = enrollmentRef.current;
    if (!currentPublicKey || finalizingRef.current) return;
    finalizingRef.current = true;
    setFinalizing(true);
    setError(null);
    try {
      const walletAddress = currentPublicKey.toBase58();
      const currentCompletedCount = currentEnrollment?.lessonFlags
        ? countCompletedLessons(currentEnrollment.lessonFlags)
        : 0;

      // Sync locally-completed lessons that are missing on-chain — sequentially
      // to avoid write-write conflicts on the shared enrollment PDA
      if (currentEnrollment?.lessonFlags && currentCompletedCount < totalLessons) {
        const progress = await learningService.getProgress(walletAddress, courseId);
        const missingIndices: number[] = [];
        for (const idx of progress.completedLessons) {
          if (!isLessonComplete(currentEnrollment.lessonFlags, idx)) {
            missingIndices.push(idx);
          }
        }
        for (const lessonIndex of missingIndices) {
          const res = await fetch("/api/complete-lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ learner: walletAddress, courseId, lessonIndex }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            if (!data.alreadyDone) {
              setError(tl("syncFailed"));
              return;
            }
          }
        }
        // Refresh enrollment to get updated bitmap before finalizing
        if (missingIndices.length > 0) {
          await refreshEnrollment();
        }
      }

      // Pre-finalize check: verify all lessons are confirmed on-chain
      const freshEnrollment = await refreshEnrollment();
      if (freshEnrollment?.lessonFlags) {
        const onChainCount = countCompletedLessons(freshEnrollment.lessonFlags);
        if (onChainCount < totalLessons) {
          setError(tl("syncFailed"));
          return;
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
        // Show completed immediately
        setOptimisticComplete(true);
        if (data.explorerUrl) setExplorerUrl(data.explorerUrl);
        // Background: sync actual on-chain state
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
      finalizingRef.current = false;
      setFinalizing(false);
    }
  }, [totalLessons, courseId, slug, refreshEnrollment, tl]);

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
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--nd-highlight-blue, #6693F7)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              marginTop: "4px",
              display: "inline-block",
            }}
          >
            View on Explorer
          </a>
        )}
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
