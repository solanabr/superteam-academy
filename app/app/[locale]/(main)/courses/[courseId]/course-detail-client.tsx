"use client";

import { useTranslations } from "next-intl";
import { useCourse } from "@/hooks/use-course";
import { useCourses } from "@/hooks/use-courses";
import { useEnrollment, type EnrollmentAccount } from "@/hooks/use-enrollment";
import { useXpBalance } from "@/hooks/use-xp-balance";
import { useWallet } from "@solana/wallet-adapter-react";
import { EnrollButton } from "@/components/enrollment/enroll-button";
import { UnenrollButton } from "@/components/enrollment/unenroll-button";
import { LessonModules } from "@/components/enrollment/lesson-modules";
import { ProgressBar } from "@/components/enrollment/progress-bar";
import { CompletionModal } from "@/components/enrollment/completion-modal";
import { PrerequisiteBadge } from "@/components/course/prerequisite-badge";
import { CardSkeleton } from "@/components/ui/skeleton";
import { difficultyLabel, formatXp } from "@/lib/format";
import { countCompletedLessons, getCompletedLessonIndices } from "@/lib/bitmap";
import { recordActivity } from "@/lib/streak";
import { trackEvent } from "@/lib/analytics";
import { QUIZ_QUESTIONS, type ClientQuizQuestion } from "@/lib/quiz-questions";
import BN from "bn.js";
import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function CourseDetailClient({ courseId }: { courseId: string }) {
  const t = useTranslations("enrollment");
  const tc = useTranslations("courses");
  const { publicKey } = useWallet();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: courses } = useCourses();
  const { data: enrollment, isLoading: enrollmentLoading } = useEnrollment(courseId);
  const { refetch: refetchXp } = useXpBalance();
  const queryClient = useQueryClient();

  const prereqCourseId = useMemo(() => {
    if (!course?.prerequisite || !courses) return undefined;
    return courses.find((c) => c.publicKey === course.prerequisite)?.courseId;
  }, [course?.prerequisite, courses]);
  const { data: prereqEnrollment } = useEnrollment(prereqCourseId);
  const isPrereqMet = !course?.prerequisite || !!prereqEnrollment?.completedAt;

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLesson, setQuizLesson] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const lessonFlags = enrollment?.lessonFlags ?? [new BN(0), new BN(0), new BN(0), new BN(0)];
  const completedCount = enrollment ? countCompletedLessons(lessonFlags) : 0;
  const completedIndices = enrollment ? getCompletedLessonIndices(lessonFlags, course?.lessonCount ?? 0) : [];
  const nextLesson = enrollment && course
    ? Array.from({ length: course.lessonCount }, (_, i) => i).find(
        (i) => !completedIndices.includes(i)
      ) ?? -1
    : -1;
  const isFinalized = !!enrollment?.completedAt;

  const handleLessonClick = useCallback((lessonIndex: number) => {
    const questions = QUIZ_QUESTIONS[courseId]?.[lessonIndex];
    if (!questions?.length) {
      submitLesson(lessonIndex, []);
      return;
    }
    setQuizLesson(lessonIndex);
    setAnswers(new Array(questions.length).fill(-1));
    setShowQuiz(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const submitLesson = async (lessonIndex: number, ans: number[]) => {
    if (!publicKey || !enrollment) return;
    setSubmitting(true);

    const enrollmentKey = ["enrollment", courseId, publicKey.toBase58()];
    const prevEnrollment: EnrollmentAccount = { ...enrollment };
    const wordIndex = Math.floor(lessonIndex / 64);
    const bitIndex = lessonIndex % 64;
    const newFlags = enrollment.lessonFlags.map((bn) => bn.clone());
    newFlags[wordIndex] = newFlags[wordIndex].or(new BN(1).shln(bitIndex));
    queryClient.setQueryData(enrollmentKey, {
      ...enrollment,
      lessonFlags: newFlags,
    });

    try {
      const res = await fetch("/api/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonIndex,
          answers: ans,
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
      setShowQuiz(false);

      await refetchXp();

      if (course && completedCount + 1 >= course.lessonCount) {
        await autoFinalize();
      }
    } catch {
      queryClient.setQueryData(enrollmentKey, prevEnrollment);
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const autoFinalize = async () => {
    if (!publicKey) return;
    try {
      const res = await fetch("/api/finalize-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, learnerPubkey: publicKey.toBase58() }),
      });
      if (res.ok) {
        setShowCompletion(true);

        await fetch("/api/issue-credential", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, learnerPubkey: publicKey.toBase58() }),
        });

        await queryClient.invalidateQueries({ queryKey: ["enrollment", courseId] });
        await queryClient.invalidateQueries({ queryKey: ["credentials"] });
        await refetchXp();
      }
    } catch {
      // Finalization can fail gracefully
    }
  };

  if (courseLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <CardSkeleton />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center text-content-muted">
        Course not found
      </div>
    );
  }

  const totalXp = course.xpPerLesson * course.lessonCount;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="rounded-full bg-solana-purple/20 px-2.5 py-0.5 text-xs text-solana-purple">
            {tc("track")} {course.trackId}
          </span>
          <span className="text-xs text-content-muted">
            {difficultyLabel(course.difficulty)}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-content">{course.courseId}</h1>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: tc("lessons"), value: course.lessonCount },
          { label: tc("totalXp"), value: formatXp(totalXp) },
          { label: tc("xpPerLesson"), value: `+${course.xpPerLesson}` },
          { label: tc("enrolled"), value: course.totalEnrollments },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-edge bg-card p-3 text-center"
          >
            <p className="text-lg font-bold text-content">{s.value}</p>
            <p className="text-xs text-content-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Prerequisite */}
      {course.prerequisite && (
        <div className="mb-6">
          <PrerequisiteBadge
            prerequisiteCourseId={prereqCourseId || course.prerequisite}
            isMet={isPrereqMet}
          />
        </div>
      )}

      {/* Enrollment & Progress */}
      {!enrollment && !enrollmentLoading && (
        <EnrollButton courseId={courseId} prerequisite={course.prerequisite} />
      )}

      {enrollment && (
        <div className="space-y-6">
          {isFinalized ? (
            <div className="rounded-xl border border-solana-green/30 bg-solana-green/5 p-6 text-center">
              <p className="text-lg font-bold text-solana-green">{t("courseCompleted")}</p>
              {enrollment.credentialAsset && (
                <p className="mt-2 text-sm text-content-secondary">{t("credentialEarned")}</p>
              )}
            </div>
          ) : (
            <>
              <ProgressBar
                value={completedCount}
                max={course.lessonCount}
                label={t("lessonsCompleted", {
                  count: completedCount,
                  total: course.lessonCount,
                })}
              />
              <LessonModules
                lessonCount={course.lessonCount}
                lessonFlags={lessonFlags}
                nextLesson={nextLesson}
                onLessonClick={handleLessonClick}
                disabled={submitting}
                xpPerLesson={course.xpPerLesson}
              />
              <div className="flex justify-end">
                <UnenrollButton courseId={courseId} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <QuizModal
          questions={QUIZ_QUESTIONS[courseId]?.[quizLesson] ?? []}
          answers={answers}
          onChange={setAnswers}
          onSubmit={() => submitLesson(quizLesson, answers)}
          onClose={() => setShowQuiz(false)}
          submitting={submitting}
        />
      )}

      {/* Reviews */}
      <div className="mt-8 rounded-2xl border border-edge-soft bg-card p-6">
        <h3 className="mb-3 text-sm font-semibold text-content">{t("reviews")}</h3>
        <p className="text-xs text-content-muted">{t("noReviews")}</p>
      </div>

      {/* Completion Modal */}
      <CompletionModal
        open={showCompletion}
        onClose={() => setShowCompletion(false)}
        courseId={courseId}
        totalXp={totalXp}
        bonusXp={Math.floor(totalXp / 2)}
      />
    </div>
  );
}

function QuizModal({
  questions,
  answers,
  onChange,
  onSubmit,
  onClose,
  submitting,
}: {
  questions: ClientQuizQuestion[];
  answers: number[];
  onChange: (a: number[]) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const t = useTranslations("enrollment");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-edge bg-surface-secondary/95 p-6 backdrop-blur-lg max-h-[80vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-bold text-content">{t("quizTitle")}</h2>
        <div className="space-y-5">
          {questions.map((q, qi) => (
            <div key={qi}>
              <p className="mb-2 text-sm text-content-secondary">{q.question}</p>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => {
                      const newA = [...answers];
                      newA[qi] = oi;
                      onChange(newA);
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      answers[qi] === oi
                        ? "border-solana-purple bg-solana-purple/10 text-content"
                        : "border-edge text-content-secondary hover:border-edge"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-edge py-2.5 text-sm text-content-secondary hover:text-content"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={answers.includes(-1) || submitting}
            className="flex-1 rounded-lg bg-solana-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? t("completing") : t("submitAnswers")}
          </button>
        </div>
      </div>
    </div>
  );
}
