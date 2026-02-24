"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCourse } from "@/hooks/use-course";
import { useEnrollment, type EnrollmentAccount } from "@/hooks/use-enrollment";
import { useXpBalance } from "@/hooks/use-xp-balance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LessonContent } from "@/components/lesson/lesson-content";
import { LessonQuiz } from "@/components/lesson/lesson-quiz";
import { LessonNav } from "@/components/lesson/lesson-nav";
import { CodeEditor } from "@/components/lesson/code-editor";
import { CardSkeleton } from "@/components/ui/skeleton";
import { isLessonComplete } from "@/lib/bitmap";
import { recordActivity } from "@/lib/streak";
import { QUIZ_QUESTIONS } from "@/lib/quiz-questions";
import { getLessonContent, type SanityLessonContent } from "@/lib/sanity";
import BN from "bn.js";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";

export default function LessonPageClient({
  courseId,
  lessonIndex,
}: {
  courseId: string;
  lessonIndex: number;
}) {
  const t = useTranslations("enrollment");
  const { publicKey } = useWallet();
  const { data: course } = useCourse(courseId);
  const { data: enrollment } = useEnrollment(courseId);
  const { refetch: refetchXp } = useXpBalance();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [codePassed, setCodePassed] = useState(false);

  const lessonFlags = enrollment?.lessonFlags ?? [new BN(0), new BN(0), new BN(0), new BN(0)];
  const isComplete = isLessonComplete(lessonFlags, lessonIndex);

  // Fetch lesson content from Sanity
  const { data: sanityContent } = useQuery<SanityLessonContent | null>({
    queryKey: ["lesson-content", courseId, lessonIndex],
    queryFn: () => getLessonContent(courseId, lessonIndex, "en"),
    staleTime: 5 * 60 * 1000,
  });

  const questions = QUIZ_QUESTIONS[courseId]?.[lessonIndex] ?? [];

  const submitLesson = useCallback(async (answers: number[]) => {
    if (!publicKey || !enrollment) return;
    setSubmitting(true);

    const enrollmentKey = ["enrollment", courseId, publicKey.toBase58()];
    const prevEnrollment: EnrollmentAccount = { ...enrollment };
    const wordIndex = Math.floor(lessonIndex / 64);
    const bitIndex = lessonIndex % 64;
    const newFlags = enrollment.lessonFlags.map((bn) => bn.clone());
    newFlags[wordIndex] = newFlags[wordIndex].or(new BN(1).shln(bitIndex));
    queryClient.setQueryData(enrollmentKey, { ...enrollment, lessonFlags: newFlags });

    try {
      const res = await fetch("/api/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonIndex,
          answers,
          learnerPubkey: publicKey.toBase58(),
        }),
      });

      if (!res.ok) {
        queryClient.setQueryData(enrollmentKey, prevEnrollment);
        const err = await res.json();
        toast.error(err.error || "Failed to complete lesson");
        return;
      }

      const { signature } = await res.json();
      toast.success(t("xpEarned", { amount: course?.xpPerLesson ?? 0 }), {
        action: {
          label: "Solscan",
          onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, "_blank"),
        },
      });

      recordActivity();
      trackEvent("lesson_completed", { courseId, lessonIndex, xp: course?.xpPerLesson ?? 0 });
      await refetchXp();

      // Check auto-finalize
      const totalDone = enrollment.lessonFlags.reduce((acc, bn) => {
        let count = 0;
        let n = bn.clone();
        while (!n.isZero()) {
          n = n.and(n.subn(1));
          count++;
        }
        return acc + count;
      }, 0);

      if (course && totalDone + 1 >= course.lessonCount) {
        const finRes = await fetch("/api/finalize-course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, learnerPubkey: publicKey.toBase58() }),
        });
        if (finRes.ok) {
          const credRes = await fetch("/api/issue-credential", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, learnerPubkey: publicKey.toBase58() }),
          });
          if (!credRes.ok) console.warn("Credential issuance failed:", credRes.status);
        } else {
          const data = await finRes.json().catch(() => ({}));
          if (!data.error?.includes("already finalized")) {
            toast.error("Finalization failed");
          }
        }
        await queryClient.invalidateQueries({ queryKey: ["enrollment", courseId] });
        await queryClient.invalidateQueries({ queryKey: ["credentials"] });
      }
    } catch {
      queryClient.setQueryData(enrollmentKey, prevEnrollment);
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }, [publicKey, enrollment, courseId, lessonIndex, course, queryClient, refetchXp, t]);

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <CardSkeleton />
      </div>
    );
  }

  const lessonTitle = sanityContent?.title?.en ?? `Lesson ${lessonIndex + 1}`;
  const hasCodeChallenge = !!sanityContent?.codeChallenge;

  const contentSection = (
    <>
      {/* Completion badge */}
      {isComplete && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-solana-green/30 bg-solana-green/5 px-4 py-2">
          <svg className="h-4 w-4 text-solana-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-solana-green">{t("completed")}</span>
        </div>
      )}

      {/* Sanity content */}
      <div className="mb-8">
        <LessonContent body={sanityContent?.body ?? []} />
      </div>

      {/* Quiz */}
      {!isComplete && questions.length > 0 && (
        <div className="mb-8">
          <LessonQuiz
            questions={questions}
            onSubmit={submitLesson}
            submitting={submitting}
          />
        </div>
      )}

      {/* Code challenge passed indicator */}
      {codePassed && !isComplete && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-solana-green/30 bg-solana-green/5 px-4 py-2">
          <svg className="h-4 w-4 text-solana-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-solana-green">Code challenge passed</span>
        </div>
      )}

      {/* Auto-complete for lessons without quiz */}
      {!isComplete && questions.length === 0 && enrollment && (
        <div className="mb-8">
          <button
            onClick={() => submitLesson([])}
            disabled={submitting}
            className="w-full rounded-lg bg-solana-gradient py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? t("completing") : t("complete")}
          </button>
        </div>
      )}
    </>
  );

  const codeSection = sanityContent?.codeChallenge ? (
    <div className="h-full min-h-[400px]">
      <CodeEditor
        initialCode={sanityContent.codeChallenge.initialCode}
        language={sanityContent.codeChallenge.language}
        expectedOutput={sanityContent.codeChallenge.expectedOutput}
        instructions={sanityContent.codeChallenge.instructions}
        storageKey={`${courseId}:${lessonIndex}`}
        onValidate={(passed) => {
          setCodePassed(passed);
          if (passed) {
            trackEvent("code_challenge_passed", { courseId, lessonIndex });
            toast.success("Code challenge passed!");
          }
        }}
      />
    </div>
  ) : null;

  return (
    <div className="px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mx-auto mb-6 flex max-w-7xl items-center gap-2 text-xs text-content-muted">
        <Link href={`/courses/${courseId}`} className="hover:text-content-secondary">
          {courseId}
        </Link>
        <span>/</span>
        <span className="text-content-secondary">Lesson {lessonIndex + 1}</span>
      </nav>

      <h1 className="mx-auto mb-6 max-w-7xl text-2xl font-bold text-content">{lessonTitle}</h1>

      {hasCodeChallenge ? (
        /* Split pane: content left, code editor right (desktop) / stacked (mobile) */
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
          <div className="min-w-0 overflow-y-auto lg:max-h-[calc(100vh-200px)] lg:w-1/2 lg:min-w-[300px] lg:resize-x lg:overflow-auto lg:pr-4">
            {contentSection}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-edge-soft lg:sticky lg:top-24 lg:max-h-[calc(100vh-200px)]">
            {codeSection}
          </div>
        </div>
      ) : (
        /* Single column for non-code lessons */
        <div className="mx-auto max-w-3xl">
          {contentSection}
        </div>
      )}

      {/* Navigation */}
      <div className="mx-auto mt-8 max-w-7xl">
        <LessonNav
          courseId={courseId}
          lessonIndex={lessonIndex}
          totalLessons={course.lessonCount}
          isComplete={isComplete}
        />
      </div>
    </div>
  );
}
