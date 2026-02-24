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
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        paddingTop: 0,
        background: "var(--background)",
      }}
    >
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

      <main
        style={{
          marginLeft: isMobile ? 0 : "clamp(220px, 18vw, 280px)",
          flex: 1,
          maxWidth: "100%",
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: "clamp(40px, 6vh, 80px) clamp(20px, 4vw, 60px)",
            paddingBottom: "120px",
          }}
        >
          <div
            className="sa-fade-up"
            style={{ marginBottom: "clamp(40px, 6vh, 64px)" }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--c-text-muted)",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>
                {TYPE_ICONS[lesson.type] ?? "\u25EB"}
              </span>
              {lesson.type} &middot; {lesson.duration}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(36px, 5vw, 64px)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
                marginBottom: "16px",
              }}
            >
              {lesson.title}
            </h1>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--c-text-muted)",
                display: "flex",
                gap: "20px",
              }}
            >
              <span>
                {t("lessonOf", { current: lessonIndex + 1, total: allLessons.length })}
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
                borderTop: "1px solid var(--c-border-subtle)",
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
                        color: "var(--xp)",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: "var(--xp)",
                      }}
                    >
                      +{lesson.xpReward} XP
                    </span>
                  </div>
                  <button
                    onClick={navigateNext}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "14px 36px",
                      background: "none",
                      color: "var(--c-text-muted)",
                      border: "1px solid var(--c-border-subtle)",
                      cursor: "pointer",
                    }}
                  >
                    {nextLesson ? t("nextLesson") : t("backToCourse")}
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
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "14px 36px",
                    border: "none",
                    cursor: "pointer",
                    background: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  {t("completeLesson")}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      letterSpacing: "0.1em",
                      color: "var(--nd-highlight-orange)",
                      marginLeft: "8px",
                    }}
                  >
                    +{lesson.xpReward} XP
                  </span>
                </button>
              )}
            </div>
          )}

          {lesson.type === "quiz" && completed && (
            <div
              style={{
                marginTop: "32px",
                paddingTop: "24px",
                borderTop: "1px solid var(--c-border-subtle)",
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
                      color: "var(--xp)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "var(--xp)",
                    }}
                  >
                    {t("quizComplete")}
                  </span>
                </div>
                <button
                  onClick={navigateNext}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "14px 36px",
                    background: "none",
                    color: "var(--c-text-muted)",
                    border: "1px solid var(--c-border-subtle)",
                    cursor: "pointer",
                  }}
                >
                  {nextLesson ? t("nextLesson") : t("backToCourse")}
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: isMobile ? 0 : "clamp(220px, 18vw, 280px)",
            right: 0,
            padding: "20px clamp(20px, 4vw, 60px)",
            background: "var(--background)",
            borderTop: "1px solid var(--c-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 50,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--c-text-muted)",
            }}
          >
            {t("lessonOf", { current: lessonIndex + 1, total: allLessons.length })}
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {prevLesson && (
              <Link
                href={`/${locale}/courses/${slug}/lessons/${prevLesson.id}`}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "14px 36px",
                  background: "none",
                  color: "var(--c-text-muted)",
                  border: "1px solid var(--c-border-subtle)",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                ← {t("prev")}
              </Link>
            )}
            {nextLesson && (
              <Link
                href={`/${locale}/courses/${slug}/lessons/${nextLesson.id}`}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "14px 36px",
                  background: "none",
                  color: "var(--c-text-muted)",
                  border: "1px solid var(--c-border-subtle)",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                {t("next")} →
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
