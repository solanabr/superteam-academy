"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { BookOpen, X, Sparkle, ArrowUp } from "@phosphor-icons/react";
import { buildCloseEnrollmentInstruction } from "@/lib/solana/instructions";
import {
  parseProgramError,
  preflightTransaction,
} from "@/lib/solana/program-errors";
import type { CurrentCourse } from "@/hooks/use-dashboard-data";
import { deriveEndowedProgress } from "@/lib/courses/endowed-progress";
import { CourseCompletionMint } from "@/components/certificates/course-completion-mint";
import { Button } from "@/components/ui/button";
import { dispatchToast } from "@/components/ui/toast-container";

interface CurrentCoursesSectionProps {
  /** Enrolled, not-yet-minted courses resolved from the content bundle. */
  currentCourses: CurrentCourse[];
  /** Authenticated user id — gates the completion-mint overlay. */
  userId: string;
}

/**
 * "Current Courses" dashboard section — enrolled-course grid with progress
 * rings, the unenroll (close-enrollment) flow, and the completion-mint
 * overlay for finished courses.
 */
export function CurrentCoursesSection({
  currentCourses,
  userId,
}: CurrentCoursesSectionProps) {
  const t = useTranslations("dashboard");
  const tCourses = useTranslations("courses");
  const tErrors = useTranslations("programErrors");
  const locale = useLocale();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [courses, setCourses] = useState<CurrentCourse[]>([]);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);

  // Sync local courses state with data hook
  useEffect(() => {
    setCourses(currentCourses);
  }, [currentCourses]);

  const handleUnenroll = useCallback(
    async (courseId: string) => {
      if (!publicKey) {
        setWalletModalVisible(true);
        return;
      }

      setUnenrollingId(courseId);

      const withTimeout = <T,>(
        p: Promise<T>,
        ms: number,
        label: string
      ): Promise<T> =>
        Promise.race([
          p,
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error(`${label} timed out`)), ms)
          ),
        ]);

      try {
        const ix = buildCloseEnrollmentInstruction(courseId, publicKey);
        const tx = new Transaction().add(ix);

        // Pre-simulate to catch program errors before wallet popup.
        // Backpack hangs if simulation fails inside sendTransaction.
        await preflightTransaction(tx, connection, publicKey);

        const sig = await withTimeout(
          sendTransaction(tx, connection, { skipPreflight: true }),
          30_000,
          "Wallet signing"
        );
        await withTimeout(
          connection.confirmTransaction(sig, "confirmed"),
          30_000,
          "Confirmation"
        );

        // On-chain TX succeeded — Helius webhook will sync Supabase.
        // Optimistically update UI.
        setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
        dispatchToast(t("unenrollSuccess"), "success");
      } catch (err: unknown) {
        const parsed = parseProgramError(err);
        const msg = parsed.i18nKey ? tErrors(parsed.i18nKey) : parsed.fallback;
        dispatchToast(msg, "warning");
      } finally {
        setUnenrollingId(null);
      }
    },
    [publicKey, sendTransaction, connection, setWalletModalVisible, t, tErrors]
  );

  return (
    <section className="cc-section">
      <div className="cc-section-head">
        <h2 className="cc-section-title">{t("currentCourses")}</h2>
        {courses.length > 0 && (
          <span className="cc-section-count">{courses.length}</span>
        )}
      </div>

      {courses.length > 0 ? (
        <div className="cc-grid">
          {courses.map((course, i) => {
            // Endowed progress (LX-B12): a non-zero first tick at enrollment
            // (with a stated reason) and near-goal intensification, derived
            // from the honest lesson counts — which still render as-is below.
            const ep = deriveEndowedProgress(
              course.completedLessons,
              course.totalLessons
            );
            const isComplete = ep.isComplete;
            const ringR = 15;
            const ringC = 2 * Math.PI * ringR;
            const ringOffset = ringC * (1 - ep.displayFraction);
            const progressAria = t("lessonsDone", {
              completed: course.completedLessons,
              total: course.totalLessons,
            });

            return (
              <div
                key={course.courseId}
                className={
                  ep.nearGoal ? "cc-card cc-card--near-goal" : "cc-card"
                }
                style={{ "--i": i } as React.CSSProperties}
              >
                {!isComplete && (
                  <button
                    onClick={() => handleUnenroll(course.courseId)}
                    disabled={unenrollingId === course.courseId}
                    className="cc-unenroll"
                    aria-label={t("removeCourse")}
                  >
                    {unenrollingId === course.courseId ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <X size={10} weight="bold" />
                    )}
                  </button>
                )}

                <Link href={`/${locale}/courses/${course.slug}`}>
                  <div className="cc-body">
                    <div className="cc-meta">
                      <div className="cc-title">{course.title}</div>
                    </div>
                    <span
                      className="cc-progress"
                      role="img"
                      aria-label={progressAria}
                    >
                      <span className="cc-ring-wrap" aria-hidden="true">
                        <svg className="cc-ring" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r={ringR}
                            className="cc-ring-track"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r={ringR}
                            strokeDasharray={ringC}
                            strokeDashoffset={ringOffset}
                            transform="rotate(-90 18 18)"
                            className="cc-ring-fill"
                          />
                        </svg>
                        <span className="cc-ring-count">
                          <span className="cc-ring-done">
                            {course.completedLessons}
                          </span>
                          /{course.totalLessons}
                        </span>
                      </span>
                      <span className="cc-ring-label" aria-hidden="true">
                        {tCourses("lessons")}
                      </span>
                    </span>
                  </div>
                  {/* Stated reason for a pre-credited tick, or the near-goal
                      nudge — never claims a lesson that isn't done. */}
                  {ep.reasonKey ? (
                    <p className="cc-reason">
                      <Sparkle size={11} weight="fill" aria-hidden="true" />
                      {t(`endowedProgress.${ep.reasonKey}`)}
                    </p>
                  ) : ep.nearGoal ? (
                    <p className="cc-reason cc-reason--near-goal">
                      <ArrowUp size={11} weight="bold" aria-hidden="true" />
                      {t("endowedProgress.nearGoal")}
                    </p>
                  ) : null}
                </Link>

                {isComplete && userId && (
                  <div className="bg-bg/95 absolute inset-0 z-10 flex flex-col items-center justify-center px-5 backdrop-blur-md">
                    <CourseCompletionMint
                      courseId={course.courseId}
                      userId={userId}
                      totalLessons={course.totalLessons}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="cc-empty">
          <BookOpen
            size={40}
            weight="duotone"
            className="text-text-3"
            aria-hidden="true"
          />
          <p className="text-text-3">{t("noCourses")}</p>
          <Button asChild variant="push" size="sm" className="mt-2">
            <Link href={`/${locale}/courses`}>{t("browseCourses")}</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
