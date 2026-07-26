"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { BookOpen, X } from "@phosphor-icons/react";
import { buildCloseEnrollmentInstruction } from "@/lib/solana/instructions";
import {
  parseProgramError,
  preflightTransaction,
} from "@/lib/solana/program-errors";
import type { CurrentCourse } from "@/hooks/use-dashboard-data";
import { CourseCompletionMint } from "@/components/certificates/course-completion-mint";
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
            const isComplete =
              course.completedLessons >= course.totalLessons &&
              course.totalLessons > 0;
            const ringR = 15;
            const ringC = 2 * Math.PI * ringR;
            const progress =
              course.totalLessons > 0
                ? course.completedLessons / course.totalLessons
                : 0;
            const ringOffset = ringC * (1 - progress);

            return (
              <div
                key={course.courseId}
                className="cc-card"
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
                  <div className="cc-thumb" aria-hidden="true">
                    <Image
                      src={course.thumbnail || "/cover.png"}
                      alt=""
                      width={400}
                      height={225}
                      loading="lazy"
                    />
                  </div>
                  <div className="cc-body">
                    <div className="cc-meta">
                      <div className="cc-title">{course.title}</div>
                      <span className="cc-sub">
                        {course.learningPath ?? tCourses(course.difficulty)}
                      </span>
                    </div>
                    <span className="cc-progress">
                      <span className="cc-ring-wrap">
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
                      <span className="cc-ring-label">
                        {tCourses("lessons")}
                      </span>
                    </span>
                  </div>
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
          <Link
            href={`/${locale}/courses`}
            className="mt-2 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:[background:var(--primary-hover)]"
          >
            {t("browseCourses")}
          </Link>
        </div>
      )}
    </section>
  );
}
