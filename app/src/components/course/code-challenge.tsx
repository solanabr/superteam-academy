"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { ChevronRight, Loader2, CheckCircle2, MessageCircle, Sparkles, Play, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { LessonSidebar } from "./lesson-sidebar";
import { LessonNavigation } from "./lesson-navigation";
import { MobileChallengeView } from "./mobile-challenge-view";
import { LessonDiscussion } from "@/components/discussions/lesson-discussion";
import { EditorPanel, TestRunner, OutputDisplay, ChallengePrompt } from "@/components/editor";
import type { Course, Lesson, TestCase, LessonNavItem } from "@/types";

export interface CodeChallengeProps {
  lesson: Lesson;
  course: Course;
  prevLesson: LessonNavItem | null;
  nextLesson: LessonNavItem | null;
  onComplete: () => Promise<void>;
  initialCompleted: boolean;
}

export function CodeChallenge({
  lesson,
  course,
  prevLesson,
  nextLesson,
  onComplete,
  initialCompleted,
}: CodeChallengeProps) {
  const challenge = lesson.challenge!;
  const [code, setCode] = useState(challenge.starterCode);
  const [testResults, setTestResults] = useState<TestCase[]>(challenge.testCases);
  const [isRunning, setIsRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted] = useState(initialCompleted);
  const [xpAnimating, setXpAnimating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<"tests" | "output" | "discussion">("tests");
  const [runOutput, setRunOutput] = useState("");

  const allTestsPassed = testResults.every((t) => t.passed === true);

  const editorLanguage = useMemo(() => {
    switch (challenge.language) {
      case "rust": return "rust";
      case "typescript": return "typescript";
      case "json": return "json";
      default: return "typescript";
    }
  }, [challenge.language]);

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setActiveTab("tests");
    setRunOutput("");

    try {
      const res = await fetch(`/api/challenges/${challenge.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        setRunOutput("> Error: Failed to validate code. Please try again.");
        setIsRunning(false);
        return;
      }

      const data: { results: TestCase[]; output: string; allPassed: boolean } = await res.json();
      setTestResults(data.results);
      setRunOutput(data.output);
      trackEvent({ name: "code_challenge_run", params: { course_slug: course.slug, lesson_id: lesson.id, passed: data.allPassed } });
    } catch {
      setRunOutput("> Error: Network error. Please check your connection.");
    } finally {
      setIsRunning(false);
    }
  }, [code, challenge.id, course.slug, lesson.id]);

  const handleMarkComplete = useCallback(async () => {
    setCompleted(true);
    setXpAnimating(true);
    setTimeout(() => setXpAnimating(false), 1000);
    await onComplete();
  }, [onComplete]);

  const handleResetCode = useCallback(() => {
    setCode(challenge.starterCode);
    setTestResults(challenge.testCases.map((tc) => ({ ...tc, passed: undefined })));
    setRunOutput("");
  }, [challenge]);

  const handleShowSolution = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/solution`);
      if (!res.ok) return;
      const data: { solution: string } = await res.json();
      setShowSolution(true);
      setCode(data.solution);
    } catch {
      // Silently fail — button remains enabled for retry
    }
  }, [challenge.id]);

  const handleToggleHints = useCallback(() => {
    setShowHints((prev) => {
      if (!prev) setCurrentHintIndex(0);
      return !prev;
    });
  }, []);

  const handleNextHint = useCallback(() => {
    setCurrentHintIndex((prev) => prev + 1);
  }, []);

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {showSidebar && (
        <LessonSidebar course={course} currentLessonId={lesson.id} onClose={() => setShowSidebar(false)} />
      )}

      <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
        <MobileChallengeView
          lesson={lesson} challenge={challenge} courseSlug={course.slug}
          code={code} setCode={setCode} testResults={testResults} isRunning={isRunning}
          showHints={showHints} currentHintIndex={currentHintIndex}
          showSolution={showSolution} completed={completed} allTestsPassed={allTestsPassed}
          xpAnimating={xpAnimating} activeTab={activeTab} setActiveTab={setActiveTab}
          runOutput={runOutput} editorLanguage={editorLanguage}
          onRunCode={handleRunCode} onMarkComplete={handleMarkComplete}
          onResetCode={handleResetCode} onShowSolution={handleShowSolution}
          onToggleHints={handleToggleHints} onNextHint={handleNextHint}
          showSidebar={showSidebar} setShowSidebar={setShowSidebar}
          prevLesson={prevLesson} nextLesson={nextLesson}
        />
      </div>

      <div className="hidden flex-1 lg:flex lg:flex-col">
        <PanelGroup orientation="horizontal" className="flex-1">
          <Panel defaultSize={45} minSize={30}>
            <DesktopPromptPanel
              lesson={lesson} challenge={challenge} courseSlug={course.slug}
              testResults={testResults} showHints={showHints}
              onToggleHints={handleToggleHints}
              currentHintIndex={currentHintIndex} onNextHint={handleNextHint}
              showSolution={showSolution} onShowSolution={handleShowSolution}
              showSidebar={showSidebar} setShowSidebar={setShowSidebar}
              prevLesson={prevLesson} nextLesson={nextLesson}
            />
          </Panel>
          <PanelResizeHandle className="w-1.5 bg-border transition-colors hover:bg-primary/50 data-[resize-handle-active]:bg-primary" />
          <Panel defaultSize={55} minSize={35}>
            <DesktopEditorPanel
              lesson={lesson} courseSlug={course.slug} courseId={course.id} challenge={challenge}
              code={code} setCode={setCode} editorLanguage={editorLanguage}
              testResults={testResults} isRunning={isRunning} activeTab={activeTab}
              setActiveTab={setActiveTab} runOutput={runOutput} completed={completed}
              allTestsPassed={allTestsPassed} xpAnimating={xpAnimating}
              onRunCode={handleRunCode} onMarkComplete={handleMarkComplete}
              onResetCode={handleResetCode} nextLesson={nextLesson}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

function DesktopPromptPanel({
  lesson, challenge, courseSlug, testResults, showHints,
  onToggleHints, currentHintIndex, onNextHint,
  showSolution, onShowSolution,
  showSidebar, setShowSidebar, prevLesson, nextLesson,
}: {
  lesson: Lesson; challenge: NonNullable<Lesson["challenge"]>; courseSlug: string;
  testResults: TestCase[]; showHints: boolean;
  onToggleHints: () => void;
  currentHintIndex: number; onNextHint: () => void;
  showSolution: boolean; onShowSolution: () => void;
  showSidebar: boolean; setShowSidebar: (v: boolean) => void;
  prevLesson: LessonNavItem | null; nextLesson: LessonNavItem | null;
}) {
  const t = useTranslations("lesson");
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <List className="h-3.5 w-3.5" />
              {t("challenge.modules")}
            </button>
          </div>
          <ChallengePrompt
            title={lesson.title}
            description={lesson.description}
            challenge={challenge}
            testResults={testResults}
            showHints={showHints}
            onToggleHints={onToggleHints}
            currentHintIndex={currentHintIndex}
            onNextHint={onNextHint}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
          />
        </div>
      </div>
      <LessonNavigation courseSlug={courseSlug} prevLesson={prevLesson} nextLesson={nextLesson} compact />
    </div>
  );
}

function DesktopEditorPanel({
  lesson, courseSlug, courseId, challenge, code, setCode, editorLanguage,
  testResults, isRunning, activeTab, setActiveTab, runOutput,
  completed, allTestsPassed, xpAnimating,
  onRunCode, onMarkComplete, onResetCode, nextLesson,
}: {
  lesson: Lesson; courseSlug: string; courseId: string; challenge: NonNullable<Lesson["challenge"]>;
  code: string; setCode: (v: string) => void; editorLanguage: string;
  testResults: TestCase[]; isRunning: boolean; activeTab: "tests" | "output" | "discussion";
  setActiveTab: (v: "tests" | "output" | "discussion") => void; runOutput: string;
  completed: boolean; allTestsPassed: boolean; xpAnimating: boolean;
  onRunCode: () => void; onMarkComplete: () => void; onResetCode: () => void;
  nextLesson: LessonNavItem | null;
}) {
  const t = useTranslations("lesson");
  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      <EditorPanel
        code={code}
        language={challenge.language}
        editorLanguage={editorLanguage}
        isRunning={isRunning}
        onCodeChange={setCode}
        onRun={onRunCode}
        onReset={onResetCode}
      />

      <div className="border-t border-[#333]">
        <div className="flex items-center gap-px bg-[#252526]">
          <button onClick={() => setActiveTab("tests")} className={cn("px-4 py-2 text-xs font-medium transition-colors", activeTab === "tests" ? "bg-[#1e1e1e] text-[#ccc]" : "text-[#888] hover:text-[#ccc]")}>
            {t("challenge.tests")}{testResults.some((r) => r.passed !== undefined) && <span className="ml-1.5">{testResults.filter((r) => r.passed).length}/{testResults.length}</span>}
          </button>
          <button onClick={() => setActiveTab("output")} className={cn("px-4 py-2 text-xs font-medium transition-colors", activeTab === "output" ? "bg-[#1e1e1e] text-[#ccc]" : "text-[#888] hover:text-[#ccc]")}>
            {t("editor.output")}
          </button>
          <button onClick={() => setActiveTab("discussion")} className={cn("flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors", activeTab === "discussion" ? "bg-[#1e1e1e] text-[#ccc]" : "text-[#888] hover:text-[#ccc]")}>
            <MessageCircle className="h-3 w-3" />
            Discussion
          </button>
        </div>
        <div className={cn("overflow-y-auto bg-[#1e1e1e]", activeTab === "discussion" ? "h-64 p-4" : "h-36 p-3")}>
          {activeTab === "tests" ? (
            <TestRunner testResults={testResults} variant="panel" />
          ) : activeTab === "output" ? (
            <OutputDisplay output={runOutput} placeholder={t("challenge.outputPlaceholder")} />
          ) : (
            <LessonDiscussion lessonId={lesson.id} courseId={courseId} />
          )}
        </div>

        <div className="relative flex items-center justify-between border-t border-[#333] px-4 py-2.5">
          {xpAnimating && (
            <span className="animate-xp-gain absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap text-sm font-bold text-xp">
              +{lesson.xpReward} XP
            </span>
          )}
          <div className="text-xs text-[#888]">
            {allTestsPassed && !completed && t("challenge.allTestsPassed")}
            {completed && (
              <span className="flex items-center gap-1 text-brazil-green">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t("challenge.challengeCompleted")}
              </span>
            )}
          </div>
          {completed ? (
            <div className="flex items-center gap-2">
              {nextLesson ? (
                <Link href={`/courses/${courseSlug}/lessons/${nextLesson.lesson.id}`} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  {t("nextLesson")} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link href={`/courses/${courseSlug}`} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  {t("backToCourse")}
                </Link>
              )}
            </div>
          ) : allTestsPassed ? (
            <button onClick={onMarkComplete} className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-brazil-gold to-brazil-gold-light px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-brazil-gold/20 transition-all hover:shadow-xl hover:shadow-brazil-gold/30">
              <Sparkles className="h-3.5 w-3.5" /> {t("challenge.markCompleteXP", { xp: lesson.xpReward })}
            </button>
          ) : (
            <button
              onClick={onRunCode} disabled={isRunning}
              className={cn("flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-all", isRunning ? "bg-[#333] text-[#888]" : "bg-brazil-green text-white hover:bg-brazil-green/90")}
            >
              {isRunning ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("editor.running")}</> : <><Play className="h-3.5 w-3.5" />{t("runCode")}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
