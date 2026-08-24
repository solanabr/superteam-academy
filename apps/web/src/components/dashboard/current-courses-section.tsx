"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { X, Sparkle, ArrowUp } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-provider";
import { trackEvent } from "@/lib/analytics";
import {
  getDynamicSolanaAccount,
  signWithDynamicWallet,
} from "@/lib/dynamic/solana";
import { buildCloseEnrollmentInstruction } from "@/lib/solana/instructions";
import { findWalletMismatch } from "@/lib/solana/linked-wallet";
import {
  parseProgramError,
  preflightTransaction,
} from "@/lib/solana/program-errors";
import type { CurrentCourse } from "@/lib/dashboard/types";
import { deriveEndowedProgress } from "@/lib/courses/endowed-progress";
import { CourseCompletionMint } from "@/components/certificates/course-completion-mint";
import { LinkedWalletPrompt } from "@/components/wallet/linked-wallet-prompt";
import { GlyphChip } from "@/components/gamification/glyph-chip";
import { ProgressBar } from "@/components/course/progress-bar";
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
  const { profile } = useAuth();
  const [courses, setCourses] = useState<CurrentCourse[]>([]);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);
  const [walletPrompt, setWalletPrompt] = useState<"connect" | "mismatch">();
  const linkedWallet = profile?.wallet_address ?? null;

  // Sync local courses state with data hook
  useEffect(() => {
    setCourses(currentCourses);
  }, [currentCourses]);

  const handleUnenroll = useCallback(
    async (courseId: string) => {
      // Same wallet resolution as enrolment: an email sign-up holds a Dynamic
      // embedded wallet that wallet-adapter knows nothing about, and the
      // connect modal is a dead end for them. Only a learner with neither
      // wallet is asked to connect.
      const dynamicAccount = publicKey ? null : getDynamicSolanaAccount();
      const learner =
        publicKey ??
        (dynamicAccount ? new PublicKey(dynamicAccount.address) : null);
      if (!learner) {
        setWalletPrompt("connect");
        return;
      }

      // close_enrollment refunds rent to the learner and requires the learner
      // to sign, so a wallet other than the linked one can only simulate to a
      // bare failure.
      if (findWalletMismatch(learner.toBase58(), linkedWallet)) {
        setWalletPrompt("mismatch");
        return;
      }

      setWalletPrompt(undefined);
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
        const ix = buildCloseEnrollmentInstruction(courseId, learner);
        const tx = new Transaction().add(ix);

        // Pre-simulate to catch program errors before wallet popup.
        // Backpack hangs if simulation fails inside sendTransaction.
        await preflightTransaction(tx, connection, learner);

        // The embedded wallet signs via Dynamic's MPC service — no prompt,
        // no wallet-adapter.
        const sendViaWallet = dynamicAccount
          ? async () => {
              const signed = await signWithDynamicWallet(tx, dynamicAccount);
              return connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: true,
              });
            }
          : () => sendTransaction(tx, connection, { skipPreflight: true });

        const sig = await withTimeout(sendViaWallet(), 30_000, "Wallet signing");
        await withTimeout(
          connection.confirmTransaction(sig, "confirmed"),
          30_000,
          "Confirmation"
        );
        trackEvent("unenrollment_onchain", { courseId, signature: sig });

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
    [publicKey, sendTransaction, connection, linkedWallet, t, tErrors]
  );

  return (
    <section className="cc-section">
      <div className="cc-section-head">
        <h2 className="cc-section-title">{t("currentCourses")}</h2>
        {courses.length > 0 && (
          <span className="cc-section-count">{courses.length}</span>
        )}
      </div>

      {walletPrompt && (
        <LinkedWalletPrompt
          variant={walletPrompt}
          linkedWallet={linkedWallet}
          onConnect={
            walletPrompt === "connect"
              ? () => {
                  setWalletPrompt(undefined);
                  setWalletModalVisible(true);
                }
              : undefined
          }
          onDismiss={() => setWalletPrompt(undefined)}
        />
      )}

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
            const started = course.completedLessons > 0;
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
                {/* The program refuses close_enrollment once any lesson is
                    done (EnrollmentInProgress), so the ✕ says so up front
                    rather than after a failed simulation. The 24h cooldown
                    can't be gated here — the dashboard carries no enrollment
                    timestamp — and still surfaces as a mapped program error. */}
                {!isComplete && (
                  <button
                    onClick={() =>
                      started
                        ? dispatchToast(t("unenrollStarted"), "warning")
                        : handleUnenroll(course.courseId)
                    }
                    disabled={unenrollingId === course.courseId}
                    aria-disabled={started}
                    title={started ? t("unenrollStarted") : undefined}
                    className={
                      started ? "cc-unenroll opacity-40" : "cc-unenroll"
                    }
                    aria-label={
                      started ? t("unenrollStarted") : t("removeCourse")
                    }
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
                    <span className="cc-progress">
                      <span className="cc-count" aria-hidden="true">
                        <span className="cc-count-done">
                          {course.completedLessons}
                        </span>
                        /{course.totalLessons}
                        <span className="cc-count-label">
                          {tCourses("lessons")}
                        </span>
                      </span>
                      <ProgressBar
                        value={course.completedLessons}
                        max={course.totalLessons}
                        displayFraction={ep.displayFraction}
                        segmented
                        size="micro"
                        aria-label={progressAria}
                      />
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
        // No CTA here (owner, 22-08): the chip and the copy carry the state on
        // their own.
        <div className="cc-empty">
          <GlyphChip glyph="▸" size={48} empty />
          <p className="text-text-3">{t("noCourses")}</p>
        </div>
      )}
    </section>
  );
}
