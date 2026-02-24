"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { learningService } from "@/lib/services/learning-progress";
import { XPToast } from "@/components/gamification/xp-toast";
import { V9LessonSidebar } from "./lesson-sidebar";
import { QuizRenderer } from "./lesson-quiz";
import { V9ContentRenderer } from "./content-renderer";
import { CourseCompleteOverlay } from "./course-complete-overlay";
import type { Lesson, Module } from "@/lib/services/types";

const lazyConfetti = () => import("canvas-confetti").then((m) => m.default);

const TYPE_ICONS: Record<string, string> = {
  reading: "\u25EB",
  video: "\u25B6",
  challenge: "\u27E8/\u27E9",
  quiz: "\u25EF",
};

export function LessonReading({
  lesson,
  course,
  allLessons,
  lessonIndex,
  locale,
  slug,
}: {
  lesson: Lesson;
  course: { id?: string; title: string; modules: Module[]; xpReward?: number };
  allLessons: Lesson[];
  lessonIndex: number;
  locale: string;
  slug: string;
}) {
  const t = useTranslations("lesson");
  const router = useRouter();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;

  const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;
  const isLastLesson = !nextLesson;

  const [completed, setCompleted] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizationResult, setFinalizationResult] = useState<{
    xpAwarded: number;
    credentialIssued: boolean;
  } | null>(null);

  useEffect(() => {
    const userId = walletAddress ?? "local";
    const cId = course?.id ?? slug;
    learningService.getProgress(userId, cId).then((progress) => {
      if (progress.completedLessons.includes(lessonIndex)) {
        setCompleted(true);
      }
    });
  }, [walletAddress, course, slug, lessonIndex]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const triggerCelebration = useCallback(async () => {
    setShowXP(true);
    setTimeout(() => setShowXP(false), 3000);
    const confetti = await lazyConfetti();
    const colors = ["#00FFA3", "#03E1FF", "#9945FF"];
    confetti({ particleCount: 60, spread: 65, origin: { y: 0.65 }, colors });
    const end = Date.now() + 600;
    (function burst() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 50,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 50,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(burst);
    })();
    if (isLastLesson) {
      setTimeout(() => setShowCourseComplete(true), 1500);
    }
  }, [isLastLesson]);

  const callCompleteLessonAPI = useCallback(() => {
    const userId = walletAddress ?? "local";
    const cId = course?.id ?? slug;

    learningService
      .completeLesson(userId, cId, lessonIndex)
      .catch((e) => console.error("local completeLesson error:", e));

    if (walletAddress && course) {
      fetch("/api/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learner: walletAddress,
          courseId: course.id,
          lessonIndex,
        }),
      }).catch((e) => console.error("complete-lesson API error:", e));
    }
  }, [walletAddress, course, lessonIndex, slug]);

  const navigateNext = useCallback(() => {
    if (nextLesson) {
      router.push(`/${locale}/courses/${slug}/lessons/${nextLesson.id}`);
    } else {
      router.push(`/${locale}/courses/${slug}`);
    }
  }, [nextLesson, router, locale, slug]);

  const handleFinalizeCourse = useCallback(async () => {
    setIsFinalizing(true);
    try {
      if (!course) return;

      if (walletAddress) {
        const res = await fetch(`/api/courses/${slug}/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setFinalizationResult({
          xpAwarded: data.xpAwarded ?? course.xpReward,
          credentialIssued: true,
        });
      } else {
        const result = await learningService.finalizeCourse("local", course.id ?? slug);
        setFinalizationResult(result);
      }

      const confetti = await lazyConfetti();
      const colors = ["#00FFA3", "#CA9FF5", "#03E1FF", "#9945FF"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors });
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
      }, 300);
    } catch (e) {
      console.error("finalizeCourse error:", e);
      setFinalizationResult({ xpAwarded: 0, credentialIssued: false });
    } finally {
      setIsFinalizing(false);
    }
  }, [slug, walletAddress, course]);

  return (
    <div className="v9-reader-layout" style={{ minHeight: "100vh" }}>
      <XPToast amount={lesson.xpReward} show={showXP} />
      <CourseCompleteOverlay
        show={showCourseComplete}
        locale={locale}
        isFinalizing={isFinalizing}
        finalizationResult={finalizationResult}
        onFinalize={handleFinalizeCourse}
        onDismiss={() => setShowCourseComplete(false)}
      />

      {!isMobile && (
        <V9LessonSidebar
          modules={course.modules}
          activeId={lesson.id}
          locale={locale}
          slug={slug}
        />
      )}

      <main className="v9-reader-main">
        <div className="v9-reader-content">
          <div
            className="v9-fade-up"
            style={{ marginBottom: "clamp(40px, 6vh, 64px)" }}
          >
            <div className="v9-lesson-type-badge">
              <span className="v9-lesson-type-badge-icon">
                {TYPE_ICONS[lesson.type] ?? "\u25EB"}
              </span>
              {lesson.type} &middot; {lesson.duration}
            </div>
            <h1 className="v9-lesson-main-title">{lesson.title}</h1>
            <div className="v9-lesson-meta-row">
              <span>
                Lesson {lessonIndex + 1} of {allLessons.length}
              </span>
              <span>+{lesson.xpReward} XP</span>
            </div>
          </div>

          {lesson.type === "quiz" ? (
            <QuizRenderer
              content={lesson.content ?? ""}
              xpReward={lesson.xpReward}
              onComplete={() => {
                if (completed) return;
                setCompleted(true);
                triggerCelebration();
                callCompleteLessonAPI();
              }}
            />
          ) : (
            <V9ContentRenderer text={lesson.content ?? lesson.title} />
          )}

          {lesson.type !== "quiz" && (
            <div
              style={{
                marginTop: "64px",
                paddingTop: "32px",
                borderTop: "1px solid rgba(26,25,24,0.06)",
              }}
            >
              {completed ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <CheckCircle2
                      style={{
                        width: 16,
                        height: 16,
                        color: "var(--v9-sol-green)",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--v9-mono)",
                        fontSize: "12px",
                        color: "var(--v9-sol-green)",
                      }}
                    >
                      +{lesson.xpReward} XP
                    </span>
                  </div>
                  <button
                    onClick={navigateNext}
                    className="v9-complete-btn v9-complete-btn-ghost"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {nextLesson ? t("nextLesson") : "Back to Course"}
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCompleted(true);
                    triggerCelebration();
                    callCompleteLessonAPI();
                  }}
                  className="v9-complete-btn v9-complete-btn-primary"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  Complete Lesson
                  <span className="v9-xp-badge">+{lesson.xpReward} XP</span>
                </button>
              )}
            </div>
          )}

          {lesson.type === "quiz" && completed && (
            <div
              style={{
                marginTop: "32px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(26,25,24,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <CheckCircle2
                    style={{
                      width: 16,
                      height: 16,
                      color: "var(--v9-sol-green)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--v9-mono)",
                      fontSize: "12px",
                      color: "var(--v9-sol-green)",
                    }}
                  >
                    Quiz Complete
                  </span>
                </div>
                <button
                  onClick={navigateNext}
                  className="v9-complete-btn v9-complete-btn-ghost"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {nextLesson ? t("nextLesson") : "Back to Course"}
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="v9-complete-bar">
          <div className="v9-complete-text">
            Lesson {lessonIndex + 1}/{allLessons.length}
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {prevLesson && (
              <Link
                href={`/${locale}/courses/${slug}/lessons/${prevLesson.id}`}
                className="v9-complete-btn v9-complete-btn-ghost"
              >
                &#8592; Prev
              </Link>
            )}
            {nextLesson && (
              <Link
                href={`/${locale}/courses/${slug}/lessons/${nextLesson.id}`}
                className="v9-complete-btn v9-complete-btn-ghost"
              >
                Next &#8594;
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
