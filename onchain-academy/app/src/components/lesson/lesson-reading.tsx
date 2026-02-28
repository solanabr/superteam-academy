"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useWallet } from "@/lib/wallet/context";
import { learningService } from "@/lib/services/learning-progress";
import { useEnrollment, isLessonComplete, countCompletedLessons } from "@/lib/hooks/use-enrollment";
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
  const { data: session } = useSession();
  const walletAddress = publicKey?.toBase58() ?? null;
  const hasSession = !!(session?.user?.id && session.user.id === walletAddress);

  const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;
  const isLastLesson = !nextLesson;

  const [completed, setCompleted] = useState(false);
  const completedOnChainRef = useRef(false);
  const [showXP, setShowXP] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizationResult, setFinalizationResult] = useState<{
    success: boolean;
    xpAwarded: number;
    credentialIssued: boolean;
    credentialAsset?: string;
  } | null>(null);

  const { enrollment, refresh: refreshEnrollment } = useEnrollment(course?.id ?? null);

  useEffect(() => {
    const userId = walletAddress ?? "local";
    const cId = course?.id ?? slug;
    learningService.getProgress(userId, cId).then((progress) => {
      if (progress.completedLessons.includes(lessonIndex)) {
        setCompleted(true);
      }
    });
  }, [walletAddress, course, slug, lessonIndex]);

  // On-chain enrollment bitmap is authoritative — seed completed state from it
  useEffect(() => {
    if (enrollment?.lessonFlags && isLessonComplete(enrollment.lessonFlags, lessonIndex)) {
      completedOnChainRef.current = true;
      setCompleted(true);
    }
  }, [enrollment, lessonIndex]);

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
  }, []);

  const callCompleteLessonAPI = useCallback(async (): Promise<boolean> => {
    const userId = walletAddress ?? "local";
    const cId = course?.id ?? slug;

    learningService
      .completeLesson(userId, cId, lessonIndex)
      .catch((e) => console.error("local completeLesson error:", e));

    if (hasSession && walletAddress && course) {
      try {
        const res = await fetch("/api/complete-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            learner: walletAddress,
            courseId: course.id,
            lessonIndex,
          }),
        });
        return res.ok;
      } catch (e) {
        console.error("complete-lesson API error:", e);
        return false;
      }
    }
    return true;
  }, [hasSession, walletAddress, course, lessonIndex, slug]);

  const handleLessonComplete = useCallback(async () => {
    if (completed || completedOnChainRef.current) return;
    setCompleted(true);

    let allOthersDone = false;
    if (enrollment?.lessonFlags) {
      allOthersDone = true;
      for (let i = 0; i < allLessons.length; i++) {
        if (i === lessonIndex) continue;
        if (!isLessonComplete(enrollment.lessonFlags, i)) {
          allOthersDone = false;
          break;
        }
      }
    }

    triggerCelebration();

    if (allOthersDone) {
      await callCompleteLessonAPI();
      setShowCourseComplete(true);
    } else {
      callCompleteLessonAPI();
    }
  }, [completed, enrollment, allLessons, lessonIndex, triggerCelebration, callCompleteLessonAPI]);

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
        const totalLessons = allLessons.length;
        const currentEnrollment = await refreshEnrollment();

        // Sync locally-completed lessons that are missing on-chain
        if (currentEnrollment?.lessonFlags) {
          const currentCount = countCompletedLessons(currentEnrollment.lessonFlags);
          if (currentCount < totalLessons) {
            const progress = await learningService.getProgress(walletAddress, course.id ?? slug);
            for (const idx of progress.completedLessons) {
              if (!isLessonComplete(currentEnrollment.lessonFlags, idx)) {
                const syncRes = await fetch("/api/complete-lesson", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ learner: walletAddress, courseId: course.id, lessonIndex: idx }),
                });
                if (!syncRes.ok) {
                  const syncData = await syncRes.json().catch(() => ({}));
                  if (!syncData.alreadyDone) {
                    setFinalizationResult({ success: false, xpAwarded: 0, credentialIssued: false });
                    return;
                  }
                }
              }
            }
          }
        }

        // Retry verification up to 4 times with 2s delay for RPC propagation
        let verified = false;
        for (let attempt = 0; attempt < 4; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
          const fresh = await refreshEnrollment();
          if (fresh?.lessonFlags) {
            const onChainCount = countCompletedLessons(fresh.lessonFlags);
            if (onChainCount >= totalLessons) {
              verified = true;
              break;
            }
          }
        }
        if (!verified) {
          setFinalizationResult({ success: false, xpAwarded: 0, credentialIssued: false });
          return;
        }

        const res = await fetch(`/api/courses/${slug}/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setFinalizationResult({
          success: true,
          xpAwarded: data.xpAwarded ?? course.xpReward,
          credentialIssued: data.credentialIssued ?? false,
          credentialAsset: data.credentialAsset,
        });
      } else {
        const result = await learningService.finalizeCourse("local", course.id ?? slug);
        setFinalizationResult({ success: true, ...result });
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
      setFinalizationResult({ success: false, xpAwarded: 0, credentialIssued: false });
    } finally {
      setIsFinalizing(false);
    }
  }, [slug, walletAddress, course, allLessons, refreshEnrollment]);

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
              onComplete={() => handleLessonComplete()}
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
              ) : !walletAddress ? (
                <button
                  onClick={() => window.dispatchEvent(new Event("open-wallet-gateway"))}
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
                    border: "1px solid var(--c-border-subtle)",
                    cursor: "pointer",
                    background: "none",
                    color: "var(--c-text-muted)",
                  }}
                >
                  {t("connectWallet")}
                </button>
              ) : (
                <button
                  onClick={() => handleLessonComplete()}
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
