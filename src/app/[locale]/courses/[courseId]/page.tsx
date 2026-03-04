"use client";

import { use, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { useCourse } from "@/hooks/useCourses";
import { useEnrollment } from "@/hooks/useEnrollment";
import { useProgram } from "@/hooks/useProgram";
import { useSigningMode } from "@/hooks/useSigningMode";
import { getCoursePda, getEnrollmentPda } from "@/lib/pda";
import { getLesson as getLocalLesson } from "@/lib/content";
import {
  isLessonComplete,
  normalizeFlags,
  countCompletedLessons,
} from "@/lib/bitmap";
import { PageSkeleton } from "@/components/Skeleton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { CredentialModal } from "@/components/CredentialModal";
import {
  allLessonsCompleteStub,
  countCompletedLessonsStub,
  isCourseEnrolledStub,
  isCourseFinalizedStub,
  isLessonCompleteStub,
  getStubCredential,
  markCourseEnrolledStub,
  markCourseFinalizedStub,
  setStubCredential,
} from "@/lib/stubStorage";
import { track } from "@/lib/analytics";
import type { Credential } from "@/hooks/useCredentials";
import { createActionProof } from "@/lib/action-proof";
import { markLearningActivityToday } from "@/lib/streak";

const DIFFICULTY_KEYS: Record<number, string> = {
  1: "difficulty.beginner",
  2: "difficulty.intermediate",
  3: "difficulty.advanced",
};

const DIFFICULTY_STYLES: Record<
  number,
  { color: string; bg: string; border: string }
> = {
  1: {
    color: "var(--solana-green)",
    bg: "rgba(20,241,149,0.08)",
    border: "rgba(20,241,149,0.25)",
  },
  2: {
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.25)",
  },
  3: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.25)",
  },
};

interface FinalizeResponse {
  mode: "stub" | "onchain";
  bonusXp?: number;
  txSignature?: string | null;
  error?: string;
}

interface IssueCredentialResponse {
  mode: "stub" | "onchain";
  credentialId?: string;
  txSignature?: string | null;
  explorerUrl?: string | null;
  error?: string;
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const t = useTranslations("CourseDetail");
  const { courseId } = use(params);
  const routeParams = useParams();
  const locale = (routeParams?.locale as string) ?? "en";
  const { publicKey, connected, signMessage } = useWallet();
  const program = useProgram();
  const queryClient = useQueryClient();
  const signingMode = useSigningMode();

  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useCourse(courseId);
  const { data: enrollment, isLoading: enrollmentLoading } =
    useEnrollment(courseId);

  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [bonusXpEarned, setBonusXpEarned] = useState<number | null>(null);

  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedCredential, setClaimedCredential] = useState<Credential | null>(
    null,
  );
  const [stubEnrolled, setStubEnrolled] = useState(false);

  const wallet = publicKey?.toBase58() ?? null;
  const isContentCourse = course?.source === "content";

  useEffect(() => {
    if (!wallet || !isContentCourse || signingMode !== "stub") {
      setStubEnrolled(false);
      return;
    }
    setStubEnrolled(isCourseEnrolledStub(wallet, courseId));
  }, [wallet, isContentCourse, signingMode, courseId]);

  const lessonFlags = enrollment
    ? normalizeFlags(enrollment.lessonFlags)
    : null;
  const chainFinalized = !!enrollment?.completedAt;

  const stubAllDone =
    signingMode === "stub" &&
    wallet !== null &&
    course != null &&
    typeof window !== "undefined" &&
    allLessonsCompleteStub(wallet, courseId, course.lessonCount);

  const stubFinalized =
    signingMode === "stub" &&
    wallet !== null &&
    typeof window !== "undefined" &&
    isCourseFinalizedStub(wallet, courseId);

  const stubHasCredential =
    signingMode === "stub" &&
    wallet !== null &&
    typeof window !== "undefined" &&
    getStubCredential(wallet, courseId) !== null;

  const isFinalized = chainFinalized || stubFinalized;

  const chainAllDone =
    lessonFlags !== null &&
    course != null &&
    countCompletedLessons(lessonFlags) >= course.lessonCount &&
    course.lessonCount > 0;

  const allLessonsDone = chainAllDone || stubAllDone;

  const showClaim =
    isFinalized && !stubHasCredential && !enrollment?.credentialAsset;

  const chainCompletedCount = lessonFlags
    ? countCompletedLessons(lessonFlags)
    : 0;
  const demoCompletedCount =
    wallet && course
      ? countCompletedLessonsStub(wallet, courseId, course.lessonCount)
      : 0;

  const effectiveEnrolled = isContentCourse ? stubEnrolled : !!enrollment;
  const effectiveCompletedCount = isContentCourse
    ? demoCompletedCount
    : chainCompletedCount;
  const isContentReadOnly = isContentCourse && signingMode !== "stub";
  const showEnrollmentLoading = !isContentCourse && enrollmentLoading;
  const onchainCredentialAsset = enrollment?.credentialAsset ?? null;
  const progressPct =
    course && course.lessonCount > 0
      ? (effectiveCompletedCount / course.lessonCount) * 100
      : 0;

  async function handleEnroll() {
    if (!publicKey || !course) return;
    setEnrolling(true);
    setEnrollError(null);

    try {
      if (course.source === "content") {
        if (!wallet || signingMode !== "stub") {
          setEnrollError(t("errors.enrollFailed"));
          return;
        }
        markCourseEnrolledStub(wallet, courseId);
        setStubEnrolled(true);
        markLearningActivityToday();
        track.courseEnroll(courseId, `${locale}:content`);
        return;
      }

      if (!program) {
        setEnrollError(t("errors.enrollFailed"));
        return;
      }

      const [coursePda] = getCoursePda(courseId);
      const [enrollmentPda] = getEnrollmentPda(courseId, publicKey);

      const remainingAccounts = [];
      if (course.prerequisite) {
        const prereqCourseId = courseId;
        const [prereqCoursePda] = getCoursePda(prereqCourseId);
        const [prereqEnrollmentPda] = getEnrollmentPda(
          prereqCourseId,
          publicKey,
        );
        remainingAccounts.push(
          { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
          { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = (program.methods as any).enroll(courseId).accountsPartial({
        course: coursePda,
        enrollment: enrollmentPda,
        learner: publicKey,
        systemProgram: SystemProgram.programId,
      });

      if (remainingAccounts.length > 0) {
        tx.remainingAccounts(remainingAccounts);
      }

      await tx.rpc();

      await queryClient.invalidateQueries({
        queryKey: ["enrollment", courseId, publicKey.toBase58()],
      });
      markLearningActivityToday();
      track.courseEnroll(courseId, locale);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.enrollFailed");
      if (msg.includes("PrerequisiteNotMet")) {
        setEnrollError(t("errors.prerequisiteNotMet"));
      } else if (msg.includes("CourseNotActive")) {
        setEnrollError(t("errors.courseInactive"));
      } else {
        setEnrollError(msg);
      }
    } finally {
      setEnrolling(false);
    }
  }

  async function handleFinalize() {
    if (!wallet) return;
    setFinalizing(true);
    setFinalizeError(null);

    try {
      const proof = await createActionProof(signMessage, {
        action: "finalize_course",
        learner: wallet,
        courseId,
      });

      const res = await fetch("/api/finalize-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learner: wallet, courseId, proof }),
      });
      const data = (await res.json()) as FinalizeResponse;

      if (!res.ok) {
        setFinalizeError(
          data.error === "UNAUTHORIZED_ACTION"
            ? t("errors.finalizeFailed")
            : (data.error ?? t("errors.finalizeFailed")),
        );
        return;
      }

      if (data.mode === "stub" && wallet) {
        markCourseFinalizedStub(wallet, courseId);
      }

      setBonusXpEarned(data.bonusXp ?? 0);
      markLearningActivityToday();
      track.courseFinalize(courseId, data.mode, data.bonusXp ?? 0);

      if (publicKey) {
        await queryClient.invalidateQueries({
          queryKey: ["enrollment", courseId, publicKey.toBase58()],
        });
      }
    } catch {
      setFinalizeError(t("errors.network"));
    } finally {
      setFinalizing(false);
    }
  }

  async function handleClaimCredential() {
    if (!wallet) return;
    setClaiming(true);
    setClaimError(null);

    try {
      const proof = await createActionProof(signMessage, {
        action: "issue_credential",
        learner: wallet,
        courseId,
      });

      const res = await fetch("/api/issue-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learner: wallet, courseId, proof }),
      });
      const data = (await res.json()) as IssueCredentialResponse;

      if (!res.ok && res.status !== 409) {
        setClaimError(
          data.error === "UNAUTHORIZED_ACTION"
            ? t("errors.claimFailed")
            : (data.error ?? t("errors.claimFailed")),
        );
        return;
      }

      const credId =
        data.credentialId ??
        (res.status === 409 ? getStubCredential(wallet, courseId) : null);

      if (credId) {
        if (data.mode === "stub" || res.status === 409) {
          setStubCredential(wallet, courseId, credId);
        }
        markLearningActivityToday();

        const credential: Credential = {
          id: credId,
          name:
            data.mode === "stub"
              ? t("credential.stubName", { courseId })
              : t("credential.name", { courseId }),
          image: null,
          attributes: [
            { trait_type: "track", value: courseId },
            ...(data.mode === "stub"
              ? [{ trait_type: "source", value: "stub" }]
              : []),
          ],
          explorerUrl: data.explorerUrl ?? "#",
          isStub: data.mode === "stub",
        };

        setClaimedCredential(credential);

        await queryClient.invalidateQueries({
          queryKey: ["credentials", wallet],
        });

        if (res.ok) {
          track.credentialIssued(courseId, credId, data.mode);
        }
      }
    } catch {
      setClaimError(t("errors.network"));
    } finally {
      setClaiming(false);
    }
  }

  // ── Loading / error ────────────────────────────────────────────────────────
  if (courseLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-2xl">
          <BackLink locale={locale} />
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-2xl">
          <BackLink locale={locale} />
          <ErrorBanner message={t("errors.notFound")} />
        </div>
      </div>
    );
  }

  if (!course.isActive) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-2xl">
          <BackLink locale={locale} />
          <ErrorBanner message={t("errors.courseInactive")} />
        </div>
      </div>
    );
  }

  const diffStyle = DIFFICULTY_STYLES[course.difficulty];
  const diffKey = DIFFICULTY_KEYS[course.difficulty];
  const diffLabel = diffKey ? t(diffKey) : null;
  const totalXp = Math.floor(course.lessonCount * course.xpPerLesson * 1.5);
  const bonusXp = Math.floor((course.lessonCount * course.xpPerLesson) / 2);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-2xl">
      <CredentialModal
        credential={claimedCredential}
        onClose={() => setClaimedCredential(null)}
      />

      <BackLink locale={locale} />

      {/* ── Course header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {course.courseId}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {diffLabel && diffStyle && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                color: diffStyle.color,
                background: diffStyle.bg,
                border: `1px solid ${diffStyle.border}`,
              }}
            >
              {diffLabel}
            </span>
          )}
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {t("meta.lessons", { count: course.lessonCount })}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              color: "var(--text-purple)",
              background: "rgba(153,69,255,0.08)",
              border: "1px solid rgba(153,69,255,0.2)",
            }}
          >
            {t("meta.xpPerLesson", { xp: course.xpPerLesson })}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {t("meta.trackLevel", {
              track: course.trackId,
              level: course.trackLevel,
            })}
          </span>
        </div>
      </div>

      {/* ── Enrollment status section ────────────────────────────────────── */}
      {!connected ? (
        <div
          className="rounded-xl p-5 mb-6 text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p
            className="text-sm mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("status.connectWallet")}
          </p>
        </div>
      ) : isContentReadOnly ? (
        <div
          className="rounded-xl p-5 mb-6"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            color: "#fbbf24",
          }}
        >
          <p className="text-sm font-medium mb-1">{t("status.contentPreviewTitle")}</p>
          <p className="text-xs">
            {t("status.contentPreviewBody")}
          </p>
        </div>
      ) : showEnrollmentLoading ? (
        <div
          className="h-14 rounded-xl mb-6 skeleton-shimmer"
          style={{ background: "var(--bg-surface)" }}
        />
      ) : !effectiveEnrolled ? (
        <div className="mb-6">
          {enrollError && (
            <div className="mb-3">
              <ErrorBanner message={enrollError} />
            </div>
          )}
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="min-h-[44px] px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--solana-purple)",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              if (!enrolling)
                (e.currentTarget as HTMLElement).style.background =
                  "var(--solana-purple-dim)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--solana-purple)";
            }}
          >
            {enrolling
              ? t("actions.enrolling")
              : isContentCourse
                ? t("actions.enroll")
                : t("actions.enroll")}
          </button>
        </div>
      ) : isFinalized ? (
        /* Finalized state */
        <div
          className="rounded-xl p-5 mb-6 space-y-3"
          style={{
            background: "rgba(20,241,149,0.06)",
            border: "1px solid rgba(20,241,149,0.25)",
          }}
        >
          <p className="font-semibold" style={{ color: "var(--solana-green)" }}>
            {t("status.completed")}
          </p>
          {bonusXpEarned !== null && bonusXpEarned > 0 && (
            <p className="text-sm" style={{ color: "var(--text-purple)" }}>
              {t("status.bonusXp", {
                xp: bonusXpEarned,
                local: "",
              })}
            </p>
          )}
          {showClaim && (
            <div>
              {claimError && (
                <p className="text-sm mb-2" style={{ color: "#f87171" }}>
                  {claimError}
                </p>
              )}
              <button
                onClick={handleClaimCredential}
                disabled={claiming}
                className="min-h-[40px] px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--solana-purple)", color: "#fff" }}
              >
                {claiming ? t("actions.minting") : t("actions.claimCredential")}
              </button>
            </div>
          )}
          {(stubHasCredential || onchainCredentialAsset) && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {onchainCredentialAsset ? (
                <>
                  {t("status.credentialLabel")}{" "}
                  <a
                    href={`https://explorer.solana.com/address/${onchainCredentialAsset.toBase58()}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "var(--text-purple)" }}
                  >
                    {t("status.viewOnExplorer")}
                  </a>
                </>
              ) : (
                <span style={{ color: "#fbbf24" }}>
                  {t("status.localCredential")}
                </span>
              )}
            </p>
          )}
        </div>
      ) : allLessonsDone ? (
        /* All lessons done — Finalize CTA */
        <div
          className="rounded-xl p-5 mb-6 space-y-3"
          style={{
            background: "rgba(153,69,255,0.08)",
            border: "1px solid rgba(153,69,255,0.3)",
          }}
        >
          <div>
            <p
              className="font-semibold"
              style={{ color: "var(--text-purple)" }}
            >
              {t("status.allLessonsComplete")}
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("status.finalizePrompt")}
            </p>
          </div>
          {bonusXpEarned !== null && bonusXpEarned > 0 && (
            <p className="text-sm" style={{ color: "var(--text-purple)" }}>
              {t("status.bonusXp", {
                xp: bonusXpEarned,
                local: "",
              })}
            </p>
          )}
          {finalizeError && (
            <p className="text-sm" style={{ color: "#f87171" }}>
              {finalizeError}
            </p>
          )}
          {bonusXpEarned === null ? (
            <button
              onClick={handleFinalize}
              disabled={finalizing}
              className="min-h-[40px] px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--solana-purple)", color: "#fff" }}
            >
              {finalizing
                ? t("actions.finalizing")
                : t("actions.finalize", { bonusXp })}
            </button>
          ) : (
            <div className="space-y-2">
              {claimError && (
                <p className="text-sm" style={{ color: "#f87171" }}>
                  {claimError}
                </p>
              )}
              <button
                onClick={handleClaimCredential}
                disabled={claiming}
                className="min-h-[40px] px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(20,241,149,0.15)",
                  border: "1px solid rgba(20,241,149,0.35)",
                  color: "var(--solana-green)",
                }}
              >
                {claiming ? t("actions.minting") : t("actions.claimCredential")}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* In progress */
        <div
          className="rounded-xl p-5 mb-6 flex items-center justify-between gap-4"
          style={{
            background: "rgba(153,69,255,0.06)",
            border: "1px solid rgba(153,69,255,0.2)",
          }}
        >
          <div className="min-w-0">
            <p
              className="font-medium text-sm"
              style={{ color: "var(--text-purple)" }}
            >
              {t("status.inProgress")}
            </p>
            {course.lessonCount > 0 && (
              <div className="mt-2">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPct}%`,
                      background:
                        "linear-gradient(90deg, var(--solana-purple), var(--solana-green))",
                    }}
                  />
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("status.lessonsProgress", {
                    completed: effectiveCompletedCount,
                    total: course.lessonCount,
                  })}
                </p>
              </div>
            )}
          </div>
          <Link
            href={`/${locale}/courses/${courseId}/lessons/0`}
            className="shrink-0 min-h-[40px] inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{ background: "var(--solana-purple)", color: "#fff" }}
          >
            {t("actions.continue")}
          </Link>
        </div>
      )}

      {/* ── Lesson list ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2
          className="text-base font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {t("lessons.title")}
        </h2>
        <div className="space-y-2">
          {Array.from({ length: course.lessonCount }).map((_, i) => {
            const chainDone = lessonFlags
              ? isLessonComplete(lessonFlags, i)
              : false;
            const demoDone =
              !!wallet &&
              isContentCourse &&
              isLessonCompleteStub(wallet, courseId, i);
            const done = isContentCourse ? demoDone : chainDone;
            const hasLessonContent = isContentCourse
              ? !!getLocalLesson(courseId, i)
              : true;
            const canStart = effectiveEnrolled && !isFinalized && hasLessonContent;

            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl p-4 transition-all duration-150"
                style={
                  done
                    ? {
                        background: "rgba(20,241,149,0.06)",
                        border: "1px solid rgba(20,241,149,0.2)",
                      }
                    : canStart
                      ? {
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-default)",
                        }
                      : {
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          opacity: 0.55,
                        }
                }
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                    style={
                      done
                        ? {
                            background: "rgba(20,241,149,0.2)",
                            color: "var(--solana-green)",
                          }
                        : {
                            background: "var(--bg-elevated)",
                            color: "var(--text-muted)",
                          }
                    }
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: done
                        ? "var(--solana-green)"
                        : "var(--text-primary)",
                    }}
                  >
                    {t("lessons.lessonLabel", { index: i + 1 })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-purple)" }}
                  >
                    +{course.xpPerLesson} XP
                  </span>
                  {canStart ? (
                    <Link
                      href={`/${locale}/courses/${courseId}/lessons/${i}`}
                      className="min-h-[32px] inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-150"
                      style={{
                        background: done
                          ? "var(--bg-elevated)"
                          : "var(--solana-purple)",
                        color: done ? "var(--text-secondary)" : "#fff",
                      }}
                    >
                      {done ? t("lessons.review") : t("lessons.start")}
                    </Link>
                  ) : (
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {hasLessonContent ? t("lessons.locked") : t("lessons.unavailable")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── XP breakdown card ────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {t("xpBreakdown.title")}
        </h3>
        <div className="space-y-2 text-sm">
          <div
            className="flex justify-between"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>
              {t("xpBreakdown.lessonCompletions", {
                lessonCount: course.lessonCount,
                xpPerLesson: course.xpPerLesson,
              })}
            </span>
            <span style={{ color: "var(--text-purple)" }}>
              {course.lessonCount * course.xpPerLesson} XP
            </span>
          </div>
          <div
            className="flex justify-between"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>{t("xpBreakdown.completionBonus")}</span>
            <span style={{ color: "var(--text-purple)" }}>{bonusXp} XP</span>
          </div>
          <div
            className="flex justify-between pt-2 mt-1 font-semibold"
            style={{
              color: "var(--text-primary)",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <span>{t("xpBreakdown.total")}</span>
            <span className="gradient-solana-text">{totalXp} XP</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function BackLink({ locale }: { locale: string }) {
  const t = useTranslations("CourseDetail");
  return (
    <Link
      href={`/${locale}`}
      className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors duration-150"
      style={{ color: "var(--text-muted)" }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")
      }
    >
      {t("actions.backToCourses")}
    </Link>
  );
}
