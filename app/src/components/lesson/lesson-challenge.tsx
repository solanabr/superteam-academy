"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useWallet } from "@/lib/wallet/context";
import { learningService } from "@/lib/services/learning-progress";
import { useEnrollment, isLessonComplete } from "@/lib/hooks/use-enrollment";
import { Panel, Group, Separator } from "react-resizable-panels";
import { XPToast } from "@/components/gamification/xp-toast";
import { useChallengeRunner } from "@/lib/hooks/use-challenge-runner";
import { V9ChallengeSidebar } from "./challenge-sidebar";
import { CourseCompleteOverlay } from "./course-complete-overlay";
import { ChallengeEditor } from "./challenge-editor";
import { ChallengeOutput } from "./challenge-output";
import type { Lesson, Module } from "@/lib/services/types";

const lazyConfetti = () => import("canvas-confetti").then((m) => m.default);

const FILE_NAME_MAP: Record<string, string> = {
  rust: "main.rs",
  typescript: "index.ts",
  javascript: "index.js",
  json: "data.json",
};

export function LessonChallenge({
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

  const language = lesson.challenge?.language ?? "typescript";
  const fileName = FILE_NAME_MAP[language] ?? "index.ts";
  const doneCount = allLessons.filter((_, i) => i < lessonIndex).length;

  const {
    output,
    testResults,
    isRunning,
    resetOutput,
    runChallenge,
    completeLesson: completeLessonAPI,
    finalizeCourse: finalizeCourseAPI,
  } = useChallengeRunner();

  const [code, setCode] = useState(() => {
    if (typeof window !== "undefined" && lesson.challenge) {
      const saved = localStorage.getItem(`stacad:code:${slug}:${lesson.id}`);
      if (saved) return saved;
    }
    return lesson.challenge?.starterCode ?? "";
  });
  const [completed, setCompleted] = useState(false);
  const completedOnChainRef = useRef(false);
  const [showXP, setShowXP] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"instructions" | "code">(
    "instructions",
  );
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizationResult, setFinalizationResult] = useState<{
    xpAwarded: number;
    credentialIssued: boolean;
  } | null>(null);

  const { enrollment } = useEnrollment(course?.id ?? null);

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

  useEffect(() => {
    if (!lesson.challenge) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`stacad:code:${slug}:${lesson.id}`, code);
    }, 800);
    return () => clearTimeout(timer);
  }, [code, slug, lesson.id, lesson.challenge]);

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

    if (walletAddress && course) {
      return completeLessonAPI(walletAddress, course.id ?? slug, lessonIndex);
    }
    return true;
  }, [walletAddress, course, lessonIndex, slug, completeLessonAPI]);

  const handleRun = useCallback(async () => {
    if (!lesson.challenge) return;

    const { allPassed } = await runChallenge(
      code,
      lesson.challenge.language,
      lesson.challenge.testCases,
    );

    if (allPassed && !completed) {
      setCompleted(true);
      triggerCelebration();

      let allOthersDone = false;
      if (isLastLesson && enrollment?.lessonFlags) {
        allOthersDone = true;
        for (let i = 0; i < allLessons.length; i++) {
          if (i === lessonIndex) continue;
          if (!isLessonComplete(enrollment.lessonFlags, i)) {
            allOthersDone = false;
            break;
          }
        }
      }

      if (allOthersDone) {
        const confirmed = await callCompleteLessonAPI();
        if (confirmed) {
          setTimeout(() => setShowCourseComplete(true), 500);
        }
      } else {
        callCompleteLessonAPI();
      }
    }
  }, [code, lesson.challenge, completed, isLastLesson, enrollment, allLessons, lessonIndex, triggerCelebration, callCompleteLessonAPI, runChallenge]);

  const handleReset = useCallback(() => {
    setCode(lesson.challenge?.starterCode ?? "");
    resetOutput();
    if (!completedOnChainRef.current) {
      setCompleted(false);
    }
    localStorage.removeItem(`stacad:code:${slug}:${lesson.id}`);
  }, [lesson.challenge, slug, lesson.id, resetOutput]);

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
        const result = await finalizeCourseAPI(slug, walletAddress);
        setFinalizationResult({
          xpAwarded: result.xpAwarded || (course.xpReward ?? 0),
          credentialIssued: result.credentialIssued,
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
  }, [slug, walletAddress, course, finalizeCourseAPI]);

  const editorPanel = (
    <>
      <ChallengeEditor
        code={code}
        onChange={setCode}
        language={language}
        fileName={fileName}
      />
      <ChallengeOutput
        testResults={testResults}
        logs={output}
        isRunning={isRunning}
        completed={completed}
      />
    </>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
        gridTemplateRows: isMobile ? "48px 38px 1fr 40px" : "48px 1fr 40px",
        fontFamily: "var(--font-sans)",
        background: "var(--background)",
        color: "var(--foreground)",
        overflow: "hidden",
        paddingTop: "61px",
        boxSizing: "border-box",
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

      {/* NAV */}
      <nav
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 12px" : "0 20px",
          background: "var(--background)",
          borderBottom: "1px solid var(--c-border-subtle)",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 14,
            minWidth: 0,
          }}
        >
          <Link
            href={`/${locale}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: isMobile ? 9 : 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--foreground)",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            {isMobile ? "SA" : "SUPERTEAM"}
          </Link>
          <span style={{ color: "var(--c-text-muted)", fontSize: 11, flexShrink: 0 }}>
            /
          </span>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              letterSpacing: "0.08em",
              color: "var(--c-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {!isMobile && (
              <>
                <Link
                  href={`/${locale}/courses/${slug}`}
                  style={{
                    color: "var(--c-text-muted)",
                    textDecoration: "none",
                    textTransform: "uppercase" as const,
                  }}
                >
                  {course.title}
                </Link>
                <span style={{ opacity: 0.6 }}>{"\u203A"}</span>
              </>
            )}
            <span
              style={{
                color: "var(--foreground)",
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
              }}
            >
              {lesson.title}
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 18,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: isMobile ? 9 : 10.5,
              color: "var(--nd-highlight-orange)",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            +{lesson.xpReward} XP
          </span>
          {completed && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.1em",
                padding: "4px 10px",
                background: "rgba(20,241,149,0.08)",
                color: "#14F195",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Check style={{ width: 10, height: 10 }} /> {t("done")}
            </span>
          )}
        </div>
      </nav>

      {/* SIDEBAR */}
      {!isMobile && (
        <V9ChallengeSidebar
          modules={course.modules}
          activeId={lesson.id}
          locale={locale}
          slug={slug}
        />
      )}

      {/* MOBILE TAB SWITCHER */}
      {isMobile && (
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            background: "var(--background)",
            borderBottom: "1px solid var(--c-border-subtle)",
          }}
        >
          {(["instructions", "code"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                padding: "10px 0",
                border: "none",
                background:
                  mobileTab === tab
                    ? tab === "code"
                      ? "var(--code-bg)"
                      : "var(--background)"
                    : "transparent",
                color:
                  mobileTab === tab
                    ? tab === "code"
                      ? "#14F195"
                      : "var(--foreground)"
                    : "var(--c-text-muted)",
                cursor: "pointer",
                borderBottom:
                  mobileTab === tab
                    ? `2px solid ${tab === "code" ? "#14F195" : "var(--nd-highlight-orange)"}`
                    : "2px solid transparent",
                fontWeight: mobileTab === tab ? 700 : 400,
                transition: "all 0.2s",
              }}
            >
              {tab === "instructions" ? t("instructions") : t("code", { file: fileName })}
            </button>
          ))}
        </div>
      )}

      {/* MAIN: Instructions + Editor */}
      <main
        style={{
          gridRow: isMobile ? 3 : 2,
          overflow: "hidden",
        }}
      >
        {isMobile ? (
          <div style={{ display: "flex", height: "100%" }}>
            <div
              style={{
                background: "var(--background)",
                overflowY: "auto",
                padding: "20px 16px 80px",
                display: mobileTab !== "instructions" ? "none" : "block",
                width: "100%",
              }}
            >
              <InstructionsContent lesson={lesson} testResults={testResults} showHints={showHints} setShowHints={setShowHints} showSolution={showSolution} setShowSolution={setShowSolution} t={t} />
            </div>
            <div
              style={{
                background: "var(--code-bg)",
                display: mobileTab !== "code" ? "none" : "flex",
                flexDirection: "column" as const,
                overflow: "hidden",
                width: "100%",
                height: "100%",
                minHeight: 0,
              }}
            >
              {editorPanel}
            </div>
          </div>
        ) : (
          <Group orientation="horizontal" id="lesson-split">
            <Panel defaultSize="50%" minSize="30%">
              <div
                style={{
                  background: "var(--background)",
                  overflowY: "auto",
                  height: "100%",
                  padding: "28px 24px 80px",
                }}
              >
                <InstructionsContent lesson={lesson} testResults={testResults} showHints={showHints} setShowHints={setShowHints} showSolution={showSolution} setShowSolution={setShowSolution} t={t} />
              </div>
            </Panel>
            <Separator
              style={{
                width: 6,
                background: "var(--c-border-subtle)",
                cursor: "col-resize",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              className="hover:!bg-[#14F195]/40"
            />
            <Panel defaultSize="50%" minSize="30%">
              <div
                style={{
                  background: "var(--code-bg)",
                  display: "flex",
                  flexDirection: "column" as const,
                  overflow: "hidden",
                  height: "100%",
                }}
              >
                {editorPanel}
              </div>
            </Panel>
          </Group>
        )}
      </main>

      {/* BOTTOM BAR */}
      <footer
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 12px" : "0 20px",
          background: "var(--background)",
          borderTop: "1px solid var(--c-border-subtle)",
          height: 40,
          gap: 8,
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 18,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: isMobile ? 8 : 9.5,
              letterSpacing: "0.08em",
              color: "var(--c-text-muted)",
              textTransform: "uppercase" as const,
              whiteSpace: "nowrap" as const,
            }}
          >
            {isMobile
              ? `${lessonIndex + 1}/${allLessons.length}`
              : `${t("lessonOf", { current: lessonIndex + 1, total: allLessons.length })} ${"\u00B7"} ${t("lessonCompleted", { done: doneCount, total: allLessons.length })}`}
          </span>
          {!isMobile && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "var(--font-mono)",
                fontSize: 8.5,
                color: "var(--c-text-2)",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#14F195",
                }}
              />
              {t("autoSaved")}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 6 : 8,
            flexShrink: 0,
          }}
        >
          {prevLesson && (
            <Link
              href={`/${locale}/courses/${slug}/lessons/${prevLesson.id}`}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.08em",
                padding: "5px 14px",
                border: "1px solid var(--c-border-subtle)",
                background: "none",
                color: "var(--c-text-muted)",
                cursor: "pointer",
                textDecoration: "none",
                textTransform: "uppercase" as const,
              }}
            >
              {"\u2190"} {t("prev")}
            </Link>
          )}
          <button
            onClick={handleReset}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.08em",
              padding: "5px 14px",
              border: "1px solid var(--c-border-subtle)",
              background: "none",
              color: "var(--c-text-muted)",
              cursor: "pointer",
              textTransform: "uppercase" as const,
            }}
          >
            {t("reset")}
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || completed}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.1em",
              padding: "6px 20px",
              border: "none",
              background: completed ? "#14F195" : isRunning ? "var(--nd-highlight-orange)" : "var(--xp)",
              color: completed ? "var(--background)" : isRunning ? "#fff" : "var(--background)",
              cursor: completed ? "default" : isRunning ? "wait" : "pointer",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
              textTransform: "uppercase" as const,
            }}
          >
            {completed ? `\u2713 ${t("done")}` : isRunning ? t("running") : `\u25B6 ${t("runCode")}`}
          </button>
          {completed ? (
            <button
              onClick={navigateNext}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.08em",
                padding: "5px 14px",
                border: "none",
                background: "var(--foreground)",
                color: "var(--background)",
                cursor: "pointer",
                textTransform: "uppercase" as const,
              }}
            >
              {nextLesson ? t("next") : t("finish")} {"\u2192"}
            </button>
          ) : nextLesson ? (
            <Link
              href={`/${locale}/courses/${slug}/lessons/${nextLesson.id}`}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.08em",
                padding: "5px 14px",
                border: "1px solid var(--c-border-subtle)",
                background: "none",
                color: "var(--c-text-muted)",
                cursor: "pointer",
                textDecoration: "none",
                textTransform: "uppercase" as const,
              }}
            >
              {t("next")} {"\u2192"}
            </Link>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

function InstructionsContent({
  lesson,
  testResults,
  showHints,
  setShowHints,
  showSolution,
  setShowSolution,
  t,
}: {
  lesson: Lesson;
  testResults: { name: string; passed: boolean; expected?: string; actual?: string }[];
  showHints: boolean;
  setShowHints: (v: boolean) => void;
  showSolution: boolean;
  setShowSolution: (v: boolean) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", padding: "3px 10px", border: "1px solid var(--nd-highlight-orange)", color: "var(--nd-highlight-orange)", textTransform: "uppercase" as const }}>
          {t("challenge")}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--xp)", fontWeight: 700 }}>
          +{lesson.xpReward} XP
        </span>
      </div>

      <h1 style={{ fontFamily: "var(--font-brand)", fontSize: "clamp(26px, 2.8vw, 38px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 18, color: "var(--foreground)" }}>
        {lesson.title}
      </h1>

      {lesson.challenge && (
        <>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--c-text-muted)", fontWeight: 300, marginBottom: 20, whiteSpace: "pre-wrap" as const }}>
            {lesson.challenge.instructions}
          </p>

          <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.03)", borderLeft: "2px solid var(--nd-highlight-orange)", marginBottom: 28, fontSize: 13.5, color: "var(--c-text-muted)", fontStyle: "italic", lineHeight: 1.6 }}>
            {t("starterCodeHint")}
          </div>

          {lesson.challenge.testCases.length > 0 && (
            <>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.18em", color: "var(--c-text-muted)", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", textTransform: "uppercase" as const }}>
                {t("testCases")}
              </div>
              {lesson.challenge.testCases.map((tc, i) => {
                const r = testResults[i];
                return (
                  <div key={tc.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", fontSize: 13, color: r ? (r.passed ? "var(--foreground)" : "#EF4444") : "var(--c-text-muted)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${r ? (r.passed ? "#14F195" : "#EF4444") : "rgba(255,255,255,0.15)"}`, background: r ? (r.passed ? "#14F195" : "#EF4444") : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: r ? (r.passed ? "var(--background)" : "#fff") : "transparent", flexShrink: 0 }}>
                      {r ? (r.passed ? "\u2713" : "\u2717") : ""}
                    </div>
                    <span style={{ flex: 1 }}>{tc.name}</span>
                    {r && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", color: r.passed ? "#14F195" : "#EF4444" }}>
                        {r.passed ? t("pass") : t("fail")}
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <button onClick={() => setShowHints(!showHints)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.08em", color: "var(--c-text-muted)", cursor: "pointer", background: "none", border: "none", padding: "14px 0", marginTop: 8, textTransform: "uppercase" as const }}>
            <span style={{ fontSize: 12, transition: "transform 0.3s", transform: showHints ? "rotate(90deg)" : "none", display: "inline-block" }}>{"\u203A"}</span>
            {t("hints")}
          </button>
          {showHints && (
            <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderLeft: "2px solid rgba(255,255,255,0.08)", marginBottom: 8, fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.65 }}>
              <p>1. {t("hintStep1")}</p>
              <p>2. {t("hintStep2")}</p>
              <p>3. {t("hintStep3")}</p>
            </div>
          )}

          {lesson.challenge.solution && (
            <button onClick={() => setShowSolution(!showSolution)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.08em", color: "var(--c-text-muted)", cursor: "pointer", background: "none", border: "none", padding: "6px 0", textTransform: "uppercase" as const }}>
              <span style={{ fontSize: 12, transition: "transform 0.3s", transform: showSolution ? "rotate(90deg)" : "none", display: "inline-block" }}>{"\u203A"}</span>
              {showSolution ? t("hideSolution") : t("showSolution")}
            </button>
          )}
          {showSolution && lesson.challenge.solution && (
            <pre style={{ padding: "12px 16px", background: "var(--code-bg)", borderLeft: "2px solid var(--xp)", marginTop: 4, marginBottom: 8, fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", overflowX: "auto", whiteSpace: "pre-wrap" as const }}>
              {lesson.challenge.solution}
            </pre>
          )}
        </>
      )}
    </>
  );
}
